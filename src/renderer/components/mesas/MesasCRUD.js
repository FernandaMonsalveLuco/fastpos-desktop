// src/renderer/components/mesas/MesasCRUD.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

const MesasCRUD = ({ onBack }) => {
  const [mesas, setMesas] = useState([]);
  const [nuevaMesa, setNuevaMesa] = useState({
    numero: '',
    estado: 'libre',
    activo: true
  });
  const [editando, setEditando] = useState(null);
  const [liberando, setLiberando] = useState({});

  // Cargar mesas
  useEffect(() => {
    const cargarMesas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'mesas'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMesas(lista);
      } catch (error) {
        console.error('Error al cargar mesas:', error);
        alert('No se pudieron cargar las mesas.');
      }
    };
    cargarMesas();
  }, []);

  // Crear nueva mesa
  const handleCrearMesa = async (e) => {
    e.preventDefault();
    if (!nuevaMesa.numero) {
      alert('Ingresa un número de mesa');
      return;
    }

    try {
      await addDoc(collection(db, 'mesas'), nuevaMesa);
      setNuevaMesa({ numero: '', estado: 'libre', activo: true });
      // Recargar mesas
      const querySnapshot = await getDocs(collection(db, 'mesas'));
      const lista = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMesas(lista);
    } catch (error) {
      console.error('Error al crear mesa:', error);
      alert('No se pudo crear la mesa');
    }
  };

  // Actualizar mesa
  const handleActualizarMesa = async (id, datos) => {
    try {
      const mesaRef = doc(db, 'mesas', id);
      await updateDoc(mesaRef, datos);
      setMesas(prev =>
        prev.map(m => (m.id === id ? { ...m, ...datos } : m))
      );
      setEditando(null);
    } catch (error) {
      console.error('Error al actualizar mesa:', error);
      alert('No se pudo actualizar la mesa');
    }
  };

  // ✅ Liberar mesa de emergencia
  const handleLiberarMesa = async (mesaId, mesaNumero) => {
    if (!confirm(`¿Liberar la Mesa ${mesaNumero} de emergencia?\n\nEsto marcará la mesa como libre, incluso si tiene un pedido activo.`)) {
      return;
    }

    setLiberando(prev => ({ ...prev, [mesaId]: true }));

    try {
      await updateDoc(doc(db, 'mesas', mesaId), { estado: 'libre' });
      setMesas(prev =>
        prev.map(m => (m.id === mesaId ? { ...m, estado: 'libre' } : m))
      );
      alert(`✅ Mesa ${mesaNumero} liberada.`);
    } catch (error) {
      console.error('Error al liberar mesa:', error);
      alert('No se pudo liberar la mesa.');
    } finally {
      setLiberando(prev => ({ ...prev, [mesaId]: false }));
    }
  };

  // Eliminar mesa
  const handleEliminarMesa = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa? Esta acción no se puede deshacer.')) return;

    try {
      const mesaRef = doc(db, 'mesas', id);
      await deleteDoc(mesaRef);
      setMesas(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error al eliminar mesa:', error);
      alert('No se pudo eliminar la mesa');
    }
  };

  return (
    <div className="mesas-crud">
      <div className="header">
        <button onClick={onBack}>← Volver</button>
        <h2>Administrar Mesas</h2>
      </div>

      {/* Formulario para crear nueva mesa */}
      <form onSubmit={handleCrearMesa} className="crear-mesa-form">
        <input
          type="number"
          placeholder="Número de mesa"
          value={nuevaMesa.numero}
          onChange={(e) => setNuevaMesa({ ...nuevaMesa, numero: e.target.value })}
          required
        />
        <select
          value={nuevaMesa.estado}
          onChange={(e) => setNuevaMesa({ ...nuevaMesa, estado: e.target.value })}
        >
          <option value="libre">Libre</option>
          <option value="ocupada">Ocupada</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={nuevaMesa.activo}
            onChange={(e) => setNuevaMesa({ ...nuevaMesa, activo: e.target.checked })}
          />
          Activa
        </label>
        <button type="submit">Agregar Mesa</button>
      </form>

      {/* Lista de mesas */}
      <div className="mesas-list">
        <h3>Mesas existentes</h3>
        {mesas.length === 0 ? (
          <p>No hay mesas registradas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Estado</th>
                <th>Activa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.numero}</td>
                  <td>
                    {editando === mesa.id ? (
                      <select
                        defaultValue={mesa.estado}
                        onChange={(e) =>
                          handleActualizarMesa(mesa.id, { estado: e.target.value })
                        }
                      >
                        <option value="libre">Libre</option>
                        <option value="ocupada">Ocupada</option>
                      </select>
                    ) : (
                      <span className={mesa.estado === 'ocupada' ? 'estado-ocupada' : 'estado-libre'}>
                        {mesa.estado}
                      </span>
                    )}
                  </td>
                  <td>
                    {editando === mesa.id ? (
                      <input
                        type="checkbox"
                        defaultChecked={mesa.activo}
                        onChange={(e) =>
                          handleActualizarMesa(mesa.id, { activo: e.target.checked })
                        }
                      />
                    ) : (
                      mesa.activo ? '✅' : '❌'
                    )}
                  </td>
                  <td>
                    {editando === mesa.id ? (
                      <button onClick={() => setEditando(null)}>Guardar</button>
                    ) : (
                      <>
                        <button className="btn-editar" onClick={() => setEditando(mesa.id)}>Editar</button>
                        {mesa.estado === 'ocupada' && (
                          <button
                            className="btn-liberar"
                            onClick={() => handleLiberarMesa(mesa.id, mesa.numero)}
                            disabled={liberando[mesa.id]}
                          >
                            {liberando[mesa.id] ? 'Liberando...' : 'Liberar'}
                          </button>
                        )}
                        <button
                          className="btn-eliminar"
                          onClick={() => handleEliminarMesa(mesa.id)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MesasCRUD;
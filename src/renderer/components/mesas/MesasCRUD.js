// src/renderer/components/mesas/MesasCRUD.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de que la ruta sea correcta

const MesasCRUD = ({ onVolverHome }) => { // Recibe la función para volver al home
  const [mesas, setMesas] = useState([]);
  const [numero, setNumero] = useState('');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'mesas'));
      const listaMesas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMesas(listaMesas);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      // Actualizar mesa existente
      try {
        const mesaRef = doc(db, 'mesas', editingId);
        await updateDoc(mesaRef, {
          numero: parseInt(numero),
          activo
        });
        setEditingId(null);
        setNumero('');
        setActivo(true);
        cargarMesas();
      } catch (error) {
        console.error('Error al actualizar mesa:', error);
      }
    } else {
      // Crear nueva mesa
      try {
        await addDoc(collection(db, 'mesas'), {
          numero: parseInt(numero),
          activo,
          estado: 'libre',
          timestamp: new Date()
        });
        setNumero('');
        setActivo(true);
        cargarMesas();
      } catch (error) {
        console.error('Error al crear mesa:', error);
      }
    }
  };

  const handleEditar = (mesa) => {
    setEditingId(mesa.id);
    setNumero(mesa.numero);
    setActivo(mesa.activo);
  };

  const handleEliminar = async (mesaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        await deleteDoc(doc(db, 'mesas', mesaId));
        cargarMesas();
      } catch (error) {
        console.error('Error al eliminar mesa:', error);
      }
    }
  };

  if (loading) {
    return <div>Cargando mesas...</div>;
  }

  return (
    <div className="mesas-crud">
      <div className="header">
        <button onClick={onVolverHome} className="btn-volver">← Volver al Home</button>
        <h2>Administrar Mesas</h2>
      </div>
      
      {/* Formulario para crear/editar */}
      <form onSubmit={handleSubmit} className="formulario-mesa">
        <div className="campo-form">
          <label htmlFor="numero">Número de Mesa:</label>
          <input
            type="number"
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            min="1"
          />
        </div>
        
        <div className="campo-form">
          <label>
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            Activo
          </label>
        </div>
        
        <button type="submit" className="btn-guardar">
          {editingId ? 'Actualizar Mesa' : 'Crear Mesa'}
        </button>
        
        {editingId && (
          <button 
            type="button" 
            onClick={() => {
              setEditingId(null);
              setNumero('');
              setActivo(true);
            }}
            className="btn-cancelar"
          >
            Cancelar
          </button>
        )}
      </form>

      {/* Tabla de mesas */}
      <div className="tabla-mesas">
        <h3>Mesas Registradas</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Número</th>
              <th>Estado</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map((mesa) => (
              <tr key={mesa.id}>
                <td>{mesa.id}</td>
                <td>{mesa.numero}</td>
                <td>
                  {mesa.estado === 'ocupada' ? (
                    <span className="estado-ocupada">Ocupada</span>
                  ) : (
                    <span className="estado-libre">Libre</span>
                  )}
                </td>
                <td>{mesa.activo ? 'Sí' : 'No'}</td>
                <td>
                  <button 
                    onClick={() => handleEditar(mesa)}
                    className="btn-editar"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleEliminar(mesa.id)}
                    className="btn-eliminar"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MesasCRUD;
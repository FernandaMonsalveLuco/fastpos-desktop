// src/renderer/components/mesas/MesasCRUD.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const MesasCRUD = ({ onVolverHome }) => {
  const [mesas, setMesas] = useState([]);
  const [numero, setNumero] = useState('');
  const [estado, setEstado] = useState('libre'); // Nuevo estado editable
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

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

  // Función para verificar si el número de mesa ya existe (excluyendo la mesa que se está editando)
  const numeroMesaExiste = (numero, mesaId = null) => {
    return mesas.some(mesa => 
      mesa.numero === parseInt(numero) && mesa.id !== mesaId
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numeroInt = parseInt(numero);
    
    // Validación: número es requerido y positivo
    if (!numero || numeroInt <= 0) {
      setError('El número de mesa debe ser un valor positivo.');
      return;
    }

    // Validación: número de mesa ya existe
    if (numeroMesaExiste(numeroInt, editingId)) {
      setError('Ya existe una mesa con ese número.');
      return;
    }

    if (editingId) {
      // Actualizar mesa existente
      try {
        const mesaRef = doc(db, 'mesas', editingId);
        await updateDoc(mesaRef, {
          numero: numeroInt,
          estado: estado,
          activo: activo
        });
        setEditingId(null);
        setNumero('');
        setEstado('libre');
        setActivo(true);
        cargarMesas();
      } catch (error) {
        console.error('Error al actualizar mesa:', error);
        setError('Error al actualizar la mesa. Intente nuevamente.');
      }
    } else {
      // Crear nueva mesa
      try {
        await addDoc(collection(db, 'mesas'), {
          numero: numeroInt,
          estado: estado,
          activo: activo,
          timestamp: new Date()
        });
        setNumero('');
        setEstado('libre');
        setActivo(true);
        cargarMesas();
      } catch (error) {
        console.error('Error al crear mesa:', error);
        setError('Error al crear la mesa. Intente nuevamente.');
      }
    }
  };

  const handleEditar = (mesa) => {
    setEditingId(mesa.id);
    setNumero(mesa.numero);
    setEstado(mesa.estado || 'libre');
    setActivo(mesa.activo !== false); // Por defecto true si no existe
  };

  const handleEliminar = async (mesaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        await deleteDoc(doc(db, 'mesas', mesaId));
        cargarMesas();
      } catch (error) {
        console.error('Error al eliminar mesa:', error);
        setError('Error al eliminar la mesa.');
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
        {error && <div className="error-form">{error}</div>}
        
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
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="libre">Libre</option>
            <option value="ocupada">Ocupada</option>
          </select>
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
              setEstado('libre');
              setActivo(true);
              setError('');
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
              <th>Número</th>
              <th>Estado</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map((mesa) => (
              <tr key={mesa.id}>
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
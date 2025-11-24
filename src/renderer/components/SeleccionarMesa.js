// src/renderer/components/SeleccionarMesa.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SeleccionarMesa = ({ onSelectMesa, onVolverHome }) => {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

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

  const manejarSeleccionMesa = async (mesa) => {
    if (mesa.estado === 'ocupada') {
      alert('Esta mesa ya está ocupada');
      return;
    }

    try {
      const mesaRef = doc(db, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'ocupada' });

      setMesas(prev => 
        prev.map(m => 
          m.id === mesa.id ? { ...m, estado: 'ocupada' } : m
        )
      );

      onSelectMesa(mesa);
    } catch (error) {
      console.error('Error al marcar mesa como ocupada:', error);
      alert('No se pudo abrir la mesa. Inténtalo de nuevo.');
    }
  };

  // Nueva función para liberar mesa
  const liberarMesa = async (mesaId) => {
    try {
      const mesaRef = doc(db, 'mesas', mesaId);
      await updateDoc(mesaRef, { estado: 'libre' });

      setMesas(prev => 
        prev.map(m => 
          m.id === mesaId ? { ...m, estado: 'libre' } : m
        )
      );
    } catch (error) {
      console.error('Error al liberar la mesa:', error);
      alert('No se pudo liberar la mesa. Inténtalo de nuevo.');
    }
  };

  const mesasFiltradas = filtroEstado === 'todos' 
    ? mesas 
    : mesas.filter(mesa => mesa.estado === filtroEstado);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="seleccionar-mesa-header">
          <button onClick={onVolverHome} className="btn-volver">← Volver al Home</button>
          <h2>Cargando mesas...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="seleccionar-mesa-header">
        <button onClick={onVolverHome} className="btn-volver">← Volver al Home</button>
        <h2>Selecciona una mesa</h2>
        <div className="filtro-estado">
          <label htmlFor="filtro-estado">Filtrar por estado:</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select-filtro"
          >
            <option value="todos">Todos</option>
            <option value="libre">Libre</option>
            <option value="ocupada">Ocupada</option>
          </select>
        </div>
      </div>
      
      <div className="mesas-grid">
        {mesasFiltradas.map(mesa => (
          <div key={mesa.id} className="mesa-contenedor">
            <button
              className={`mesa-btn ${mesa.estado === 'ocupada' ? 'ocupada' : 'libre'}`}
              onClick={() => manejarSeleccionMesa(mesa)}
              disabled={mesa.estado === 'ocupada' || !mesa.activo}
            >
              <div className="mesa-info">
                <span className="mesa-numero">Mesa {mesa.numero}</span>
                <span className={`mesa-estado ${mesa.estado}`}>
                  {mesa.estado === 'ocupada' ? 'Ocupada' : 'Libre'}
                </span>
                {!mesa.activo && <span className="mesa-inactiva">Inactiva</span>}
              </div>
            </button>

            {/* Botón Liberar solo si la mesa está ocupada */}
            {mesa.estado === 'ocupada' && (
              <button 
                onClick={() => liberarMesa(mesa.id)} 
                className="btn-liberar-mesa"
              >
                Liberar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeleccionarMesa;
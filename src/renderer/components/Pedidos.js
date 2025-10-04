// src/renderer/components/Pedidos.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const Pedidos = ({ onBack }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        let q = query(
          collection(db, 'ventas'),
          orderBy('fecha', 'desc')
        );

        if (filtroEstado !== 'todos') {
          q = query(q, where('estado', '==', filtroEstado));
        }

        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha?.toDate ? doc.data().fecha.toDate() : null
        }));

        setPedidos(lista);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, [filtroEstado]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha);
  };

  return (
    <div className="pedidos-module">
      <h2>Gestión de Pedidos</h2>
      <button className="btn-volver" onClick={onBack}>Volver</button>

      <div className="filtros-pedidos">
        <label>Filtrar por estado:</label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="completada">Completados</option>
          <option value="pendiente">Pendientes</option>
          <option value="cancelada">Cancelados</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p>No hay pedidos {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}.</p>
      ) : (
        <div className="lista-pedidos">
          {pedidos.map(pedido => (
            <div key={pedido.id} className="pedido-item">
              <div className="pedido-header">
                <strong>Pedido #{pedido.id.substring(0, 6)}</strong>
                <span className={`estado-badge ${pedido.estado}`}>
                  {pedido.estado === 'completada' ? 'Completado' :
                   pedido.estado === 'pendiente' ? 'Pendiente' :
                   'Cancelado'}
                </span>
              </div>
              <div className="pedido-detalles">
                <p><strong>Fecha:</strong> {formatearFecha(pedido.fecha)}</p>
                <p><strong>Cajero:</strong> {pedido.cajeroNombre || '—'}</p>
                <p><strong>Total:</strong> ${pedido.total?.toLocaleString() || '0'}</p>
                <p><strong>Productos:</strong></p>
                <ul className="productos-lista">
                  {pedido.productos?.map((prod, i) => (
                    <li key={i}>
                      {prod.cantidad}x {prod.nombre} — ${prod.subtotal?.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pedidos;
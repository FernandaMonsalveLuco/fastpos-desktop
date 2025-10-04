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
      setLoading(true);
      setError(null);
      try {
        let q;

        if (filtroEstado === 'todos') {
          q = query(collection(db, 'ventas'), orderBy('fecha', 'desc'));
        } else {
          q = query(
            collection(db, 'ventas'),
            where('estado', '==', filtroEstado),
            orderBy('fecha', 'desc')
          );
        }

        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fecha: data.fecha?.toDate ? data.fecha.toDate() : null
          };
        });

        setPedidos(lista);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar los pedidos. Revisa la consola para más detalles.');
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
      minute: '2-digit',
      hour12: false
    }).format(fecha);
  };

  // Mapeo legible de estados
  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'completada': return 'Completado';
      case 'pendiente': return 'Pendiente';
      case 'cancelada': return 'Cancelado';
      default: return estado || 'Desconocido';
    }
  };

  return (
    <div className="pedidos-module">
      <h2>Gestión de Pedidos</h2>
      <button className="btn-volver" onClick={onBack}>Volver</button>

      <div className="filtros-pedidos">
        <label htmlFor="filtro-estado">Filtrar por estado:</label>
        <select
          id="filtro-estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
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
        <p>
          No hay pedidos{filtroEstado !== 'todos' ? ` con estado "${obtenerTextoEstado(filtroEstado)}"` : ''}.
        </p>
      ) : (
        <div className="lista-pedidos">
          {pedidos.map(pedido => (
            <div key={pedido.id} className="pedido-item">
              <div className="pedido-header">
                <strong>Pedido #{pedido.id.substring(0, 6)}</strong>
                <span className={`estado-badge ${pedido.estado}`}>
                  {obtenerTextoEstado(pedido.estado)}
                </span>
              </div>
              <div className="pedido-detalles">
                <p><strong>Fecha:</strong> {formatearFecha(pedido.fecha)}</p>
                <p><strong>Cajero:</strong> {pedido.cajeroNombre || '—'}</p>
                <p><strong>Total:</strong> ${pedido.total?.toLocaleString('es-ES') || '0'}</p>
                <p><strong>Productos:</strong></p>
                <ul className="productos-lista">
                  {pedido.productos?.map((prod, i) => (
                    <li key={`${pedido.id}-prod-${i}`}>
                      {prod.cantidad}x {prod.nombre} — ${prod.subtotal?.toLocaleString('es-ES') || '0'}
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
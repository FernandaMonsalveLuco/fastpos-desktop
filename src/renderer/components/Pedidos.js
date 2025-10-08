// src/renderer/components/Pedidos.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

const Pedidos = ({ onBack }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(new Set()); // Para evitar múltiples clics

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

  // ✅ Función para actualizar el estado de un pedido
  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    if (actualizando.has(pedidoId)) return; // Evitar múltiples envíos

    setActualizando(prev => new Set(prev).add(pedidoId));

    try {
      const pedidoRef = doc(db, 'ventas', pedidoId);
      await updateDoc(pedidoRef, { estado: nuevoEstado });

      // Actualizar estado local inmediatamente (optimistic update)
      setPedidos(prev =>
        prev.map(p =>
          p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
        )
      );
    } catch (err) {
      console.error('Error al actualizar el estado del pedido:', err);
      setError('No se pudo actualizar el estado del pedido. Inténtalo de nuevo.');
    } finally {
      setActualizando(prev => {
        const newSet = new Set(prev);
        newSet.delete(pedidoId);
        return newSet;
      });
    }
  };

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

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case 'completada': return 'Completado';
      case 'pendiente': return 'Pendiente';
      case 'cancelada': return 'Cancelado';
      default: return estado || 'Desconocido';
    }
  };

  // Estados permitidos (según tus opciones)
  const estadosPermitidos = ['pendiente', 'completada', 'cancelada'];

  return (
    <div className="pedidos-module">
      <h2>Gestión de Pedidos</h2>
      <button className="btn-volver" onClick={onBack}>Volver</button>

      <div className="filtros-pedidos">
        <label htmlFor="filtro-estado">Filtrar por estado:</label>
        <select
          id="filtro-estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}>
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
        <p>No hay pedidos{filtroEstado !== 'todos' ? ` con estado "${obtenerTextoEstado(filtroEstado)}"` : ''}.</p>
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

                {/* ✅ Selector para cambiar estado */}
                <div className="acciones-pedido">
                  <label>Actualizar estado:</label>
                  <select
                    value={pedido.estado}
                    onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                    disabled={actualizando.has(pedido.id)}
                  >
                    {estadosPermitidos.map(estado => (
                      <option key={estado} value={estado}>
                        {obtenerTextoEstado(estado)}
                      </option>
                    ))}
                  </select>
                  {actualizando.has(pedido.id) && <span className="loading-indicator">Guardando...</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pedidos;
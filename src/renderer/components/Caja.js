// src/renderer/components/Caja.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import TipoPago from './TipoPago'; // Asegúrate de la ruta correcta

const Caja = ({ onVolverHome }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [pedidosCaja, setPedidosCaja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensajeToast, setMensajeToast] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null); // Nuevo estado para el pedido seleccionado

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      // Obtener todos los pedidos ordenados por timestamp
      const q = query(
        collection(db, 'Pedidos'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const listaPedidos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separar pedidos por estado
      const cocina = listaPedidos.filter(p => p.estado === 'en_cocina');
      const caja = listaPedidos.filter(p => p.estado === 'en_caja');

      setPedidos(listaPedidos);
      setPedidosCocina(cocina);
      setPedidosCaja(caja);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar mensajes temporales
  const mostrarMensaje = (mensaje) => {
    setMensajeToast(mensaje);
    setTimeout(() => {
      setMensajeToast('');
    }, 3000);
  };

  // Función para pasar pedido de cocina a caja
  const enviarACaja = async (pedidoId) => {
    try {
      const pedidoRef = doc(db, 'Pedidos', pedidoId);
      await updateDoc(pedidoRef, { estado: 'en_caja' });
      
      // Actualizar estado local
      cargarPedidos();
      mostrarMensaje('Pedido enviado a caja');
    } catch (error) {
      console.error('Error al enviar pedido a caja:', error);
      mostrarMensaje('Error al enviar pedido a caja');
    }
  };

  // Función para marcar pedido como pagado (ahora abre el modal de TipoPago)
  const marcarComoPagado = (pedidoId) => {
    const pedido = pedidosCaja.find(p => p.id === pedidoId);
    if (pedido) {
      setPedidoSeleccionado(pedido); // Establece el pedido seleccionado
    } else {
      mostrarMensaje('Pedido no encontrado en la lista de caja.');
    }
  };

  // Función para manejar el pago (después de que se cierra el modal TipoPago)
  const manejarPago = async (pedidoId, metodoPago, montoRecibido) => {
    try {
      const pedidoRef = doc(db, 'Pedidos', pedidoId);
      await updateDoc(pedidoRef, { 
        estado: 'pagado',
        metodoPago, // Opcional: guardar el método de pago
        timestamp: new Date()
      });
      
      // Actualizar estado local
      cargarPedidos();
      mostrarMensaje('Pedido marcado como pagado');
      setPedidoSeleccionado(null); // Cierra el modal de TipoPago
    } catch (error) {
      console.error('Error al marcar pedido como pagado:', error);
      mostrarMensaje('Error al marcar pedido como pagado');
    }
  };

  // Función para cerrar el modal de TipoPago sin pagar
  const cerrarTipoPago = () => {
    setPedidoSeleccionado(null);
  };

  if (loading) {
    return (
      <div className="caja">
        <div className="caja-header">
          <button onClick={onVolverHome} className="btn-volver">← Volver al Home</button>
          <h2>Caja</h2>
        </div>
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="caja">
      <div className="dashboard-container">
        <div className="caja-header">
            <button onClick={onVolverHome} className="btn-volver">← Volver al Home</button>
            <h2>Caja</h2>
        </div>
        <div className="caja-contenido">
          {/* Pedidos en Cocina */}
          <div className="seccion-pedidos">
            <h3>Pedidos en Cocina</h3>
            {pedidosCocina.length === 0 ? (
              <p className="sin-pedidos">No hay pedidos en cocina</p>
            ) : (
              <div className="lista-pedidos">
                {pedidosCocina.map(pedido => (
                  <div key={pedido.id} className="pedido-item">
                    <div className="pedido-info">
                      <span className="pedido-mesa">Mesa {pedido.mesaNumero}</span>
                      <span className="pedido-total">${pedido.total?.toLocaleString('es-ES')}</span>
                    </div>
                    <div className="pedido-items">
                      {pedido.items?.map((item, index) => (
                        <div key={index} className="item-pedido">
                          <span>{item.cantidad}x {item.nombre}</span>
                          <span>${item.subtotal?.toLocaleString('es-ES')}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => enviarACaja(pedido.id)}
                      className="btn-enviar-caja"
                    >
                      Enviar a Caja
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedidos en Caja */}
          <div className="seccion-pedidos">
            <h3>Pedidos en Caja</h3>
            {pedidosCaja.length === 0 ? (
              <p className="sin-pedidos">No hay pedidos en caja</p>
            ) : (
              <div className="lista-pedidos">
                {pedidosCaja.map(pedido => (
                  <div key={pedido.id} className="pedido-item">
                    <div className="pedido-info">
                      <span className="pedido-mesa">Mesa {pedido.mesaNumero}</span>
                      <span className="pedido-total">${pedido.total?.toLocaleString('es-ES')}</span>
                    </div>
                    <div className="pedido-items">
                      {pedido.items?.map((item, index) => (
                        <div key={index} className="item-pedido">
                          <span>{item.cantidad}x {item.nombre}</span>
                          <span>${item.subtotal?.toLocaleString('es-ES')}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => marcarComoPagado(pedido.id)}
                      className="btn-marcar-pagado"
                    >
                      Marcar como Pagado
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de TipoPago */}
      {pedidoSeleccionado && (
        <TipoPago
          total={pedidoSeleccionado.total}
          onPagar={(metodo, monto) => manejarPago(pedidoSeleccionado.id, metodo, monto)}
          onCancelar={cerrarTipoPago}
        />
      )}

      {/* Toast de notificación */}
      {mensajeToast && (
        <div className="toast">
          {mensajeToast}
        </div>
      )}
    </div>
  );
};

export default Caja;
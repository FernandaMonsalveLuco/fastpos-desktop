// src/renderer/components/TomarPedido.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de que la ruta sea correcta
import SeleccionarMesa from './SeleccionarMesa';
import PedidoActivo from './pedidoActivo';

const TomarPedido = ({ onVolverHome }) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensajeToast, setMensajeToast] = useState('');

  // Cargar productos desde Firebase
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Productos'));
      const productos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(productos);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setLoading(false);
    }
  };

  const manejarSeleccionMesa = (mesa) => {
    setMesaSeleccionada(mesa);
  };

  const manejarVolver = () => {
    setMesaSeleccionada(null);
  };

  // Función para enviar pedido a cocina (guardar en la colección 'pedidos')
  const manejarEnviarPedido = async (pedidoData) => {
    try {
      // Guardar en la colección "pedidos" (minúscula, como en tu base de datos)
      await addDoc(collection(db, 'pedidos'), pedidoData);
      
      // Mostrar mensaje de confirmación
      setMensajeToast('Pedido enviado a cocina');
      setTimeout(() => setMensajeToast(''), 3000);
      
      // No liberar la mesa aquí - eso se hace en Caja.js
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      setMensajeToast('Error al enviar el pedido');
      setTimeout(() => setMensajeToast(''), 3000);
    }
  };

  const mostrarMensaje = (mensaje) => {
    setMensajeToast(mensaje);
    setTimeout(() => {
      setMensajeToast('');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="cargando-pedido">
        <h2>Cargando productos...</h2>
        <p>Por favor espere mientras se cargan los productos disponibles</p>
      </div>
    );
  }

  if (!mesaSeleccionada) {
    return (
      <SeleccionarMesa 
        onSelectMesa={manejarSeleccionMesa}
        onVolverHome={onVolverHome}
      />
    );
  }

  // Si hay mesa seleccionada, mostrar vista de pedido activo con productos
  return (
    <>
      <PedidoActivo 
        mesa={mesaSeleccionada}
        onVolver={manejarVolver}
        productosCatalogo={productos}
        onEnviarPedido={manejarEnviarPedido} // Pasar función para manejar envío a cocina
      />
      
      {/* Toast de notificación */}
      {mensajeToast && (
        <div className="toast">
          {mensajeToast}
        </div>
      )}
    </>
  );
};

export default TomarPedido;
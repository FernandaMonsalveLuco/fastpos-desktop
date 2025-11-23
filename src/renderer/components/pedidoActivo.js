// src/renderer/components/PedidoActivo.js (con botón Liberar Mesa y diseño responsivo)

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const PedidoActivo = ({ mesa, onVolver, onEnviarPedido }) => {
  const [productosPedido, setProductosPedido] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [mensajeToast, setMensajeToast] = useState('');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Cargar productos desde Firebase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Productos'));
        const productosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          insumos: doc.data().insumos || [],
        }));
        setProductosCatalogo(productosList);
        
        // Obtener categorías únicas
        const categoriasUnicas = [...new Set(productosList.map(p => p.categoria))];
        setCategorias(['todos', ...categoriasUnicas]);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Función para liberar la mesa
  const liberarMesa = async () => {
    if (!mesa || !mesa.id) {
      mostrarMensaje('Mesa no válida');
      return;
    }

    try {
      const mesaRef = doc(db, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'libre' });
      mostrarMensaje('Mesa liberada correctamente');
      onVolver(); // Regresa a la selección de mesas
    } catch (error) {
      console.error('Error al liberar la mesa:', error);
      mostrarMensaje('Error al liberar la mesa');
    }
  };

  // Filtrar productos por categoría
  const productosFiltrados = categoriaSeleccionada === 'todos' 
    ? productosCatalogo 
    : productosCatalogo.filter(p => p.categoria === categoriaSeleccionada);

  // Función para manejar la adición de productos
  const agregarProducto = (producto) => {
    const productoExistente = productosPedido.find(p => p.id === producto.id);
    
    if (productoExistente) {
      setProductosPedido(prev =>
        prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
            : p
        )
      );
    } else {
      const productoConCantidad = {
        ...producto,
        cantidad: 1,
        subtotal: producto.precio
      };
      setProductosPedido(prev => [...prev, productoConCantidad]);
    }
  };

  // Función para aumentar cantidad de un producto
  const aumentarCantidad = (id) => {
    setProductosPedido(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
          : p
      )
    );
  };

  // Función para disminuir cantidad de un producto
  const disminuirCantidad = (id) => {
    setProductosPedido(prev =>
      prev
        .map(p =>
          p.id === id && p.cantidad > 1
            ? { ...p, cantidad: p.cantidad - 1, subtotal: (p.cantidad - 1) * p.precio }
            : p
        )
        .filter(p => p.cantidad > 0)
    );
  };

  // Calcular total acumulado
  const totalAcumulado = productosPedido.reduce((sum, producto) => sum + producto.subtotal, 0);

  // Función para mostrar mensajes temporales
  const mostrarMensaje = (mensaje) => {
    setMensajeToast(mensaje);
    setTimeout(() => {
      setMensajeToast('');
    }, 3000);
  };

  // Función para eliminar un producto del pedido
  const eliminarProducto = (id) => {
    setProductosPedido(prev => prev.filter(p => p.id !== id));
  };

  // Función para enviar pedido a cocina/caja
  const enviarPedido = async () => {
    if (!mesa) {
      mostrarMensaje('No hay mesa seleccionada');
      return;
    }

    if (productosPedido.length === 0) {
      mostrarMensaje('No hay productos en el pedido');
      return;
    }

    try {
      const pedidoData = {
        mesaId: mesa.id,
        mesaNumero: mesa.numero,
        items: productosPedido.map(producto => ({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: producto.cantidad || 1,
          subtotal: producto.subtotal || producto.precio * (producto.cantidad || 1),
          categoria: producto.categoria,
          descripcion: producto.descripcion || '',
          insumos: producto.insumos || []
        })),
        total: totalAcumulado,
        estado: 'en_cocina',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        activo: true
      };

      const docRef = await addDoc(collection(db, 'Pedidos'), pedidoData);
      await onEnviarPedido({ ...pedidoData, id: docRef.id });
      setProductosPedido([]);
      mostrarMensaje('Pedido enviado a cocina');
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      mostrarMensaje('Error al enviar el pedido');
    }
  };

  // Función para manejar confirmación de envío
  const manejarEnviarPedido = () => {
    if (productosPedido.length === 0) {
      mostrarMensaje('No hay productos en el pedido');
      return;
    }
    setMostrarConfirmacion(true);
  };

  // Confirmar envío
  const confirmarEnvio = () => {
    enviarPedido();
    setMostrarConfirmacion(false);
  };

  if (loading) {
    return (
      <div className="pedido-activo">
        <div className="pedido-header">
          <button onClick={onVolver} className="btn-volver">← Volver a mesas</button>
          <h2>Pedido - Mesa {mesa?.numero}</h2>
        </div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="pedido-activo">
      <div className="pedido-header">
        <button onClick={onVolver} className="btn-volver">← Volver a mesas</button>
        <h2>Pedido - Mesa {mesa.numero}</h2>
        
        {/* Botón Liberar Mesa (solo si está ocupada) */}
        {mesa?.estado === 'ocupada' && (
          <button onClick={liberarMesa} className="btn-liberar-mesa">
            Liberar Mesa
          </button>
        )}
      </div>

      <div className="pedido-contenido">
        {/* Productos disponibles (izquierda) */}
        <div className="productos-disponibles">
          <div className="filtro-categoria">
            <label htmlFor="categoria">Categoría:</label>
            <select
              id="categoria"
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="select-categoria"
            >
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <h3>Productos</h3>
          <div className="productos-grid">
            {productosFiltrados.map(producto => (
              <div key={producto.id} className="producto-item">
                <div className="producto-info">
                  <h4>{producto.nombre}</h4>
                  <p className="producto-precio">${producto.precio?.toLocaleString('es-ES')}</p>
                  <p className="producto-descripcion">{producto.descripcion}</p>
                  <button
                    onClick={() => agregarProducto(producto)}
                    className="btn-agregar-producto"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pedido actual (derecha) */}
        <div className="pedido-actual">
          <h3>Pedido Actual</h3>
          {productosPedido.length === 0 ? (
            <p className="pedido-vacio">No hay productos en el pedido</p>
          ) : (
            <div className="pedido-items">
              <ul className="lista-items">
                {productosPedido.map((producto) => (
                  <li key={producto.id} className="item-pedido">
                    <div className="item-info">
                      <span className="item-nombre">{producto.nombre}</span>
                      <div className="item-controles">
                        <button 
                          onClick={() => disminuirCantidad(producto.id)}
                          className="btn-cantidad"
                        >
                          -
                        </button>
                        <span className="item-cantidad">{producto.cantidad}</span>
                        <button 
                          onClick={() => aumentarCantidad(producto.id)}
                          className="btn-cantidad"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="item-detalles">
                      <span className="item-precio">${producto.subtotal?.toLocaleString('es-ES')}</span>
                      <button
                        onClick={() => eliminarProducto(producto.id)}
                        className="btn-eliminar-item"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="pedido-totales">
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>${totalAcumulado?.toLocaleString('es-ES')}</span>
                </div>
              </div>

              <button 
                onClick={manejarEnviarPedido}
                className="btn-enviar-pedido"
              >
                Enviar a Cocina
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="modal-confirmacion">
          <div className="modal-content">
            <h3>Confirmar envío</h3>
            <p>¿Estás seguro que deseas enviar este pedido a cocina?</p>
            <div className="modal-buttons">
              <button onClick={confirmarEnvio} className="btn-confirmar">
                Sí, enviar
              </button>
              <button 
                onClick={() => setMostrarConfirmacion(false)} 
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
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

export default PedidoActivo;
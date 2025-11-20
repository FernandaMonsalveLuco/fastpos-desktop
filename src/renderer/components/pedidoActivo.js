// src/renderer/components/PedidoActivo.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de que la ruta sea correcta

const PedidoActivo = ({ mesa, onVolver, productosCatalogo = [], onEnviarPedido }) => {
  const [productosPedido, setProductosPedido] = useState([]);
  const [productosLocales, setProductosLocales] = useState(productosCatalogo);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [mensajeToast, setMensajeToast] = useState('');

  // Inicializar categorías cuando se cargan los productos
  useEffect(() => {
    // Obtener categorías únicas
    const categoriasUnicas = [...new Set(productosLocales.map(p => p.categoria))];
    setCategorias(['todos', ...categoriasUnicas]);
  }, [productosLocales]);

  // Filtrar productos por categoría
  const productosFiltrados = categoriaSeleccionada === 'todos' 
    ? productosLocales 
    : productosLocales.filter(p => p.categoria === categoriaSeleccionada);

  // Función para manejar la adición de productos
  const agregarProducto = (producto) => {
    const productoExistente = productosPedido.find(p => p.id === producto.id);
    
    if (productoExistente) {
      // Si el producto ya existe, aumentar la cantidad
      setProductosPedido(prev =>
        prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
            : p
        )
      );
    } else {
      // Si es nuevo, agregarlo
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
        .filter(p => p.cantidad > 0) // Eliminar productos con cantidad 0
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

  // Función para enviar pedido a cocina (usando la función del padre)
  const enviarPedido = async () => {
    // Validaciones
    if (!mesa) {
      mostrarMensaje('No hay mesa seleccionada');
      return;
    }

    if (productosPedido.length === 0) {
      mostrarMensaje('No hay productos en el pedido');
      return;
    }

    try {
      // Crear el pedido en Firebase con la estructura correcta
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
        estado: 'en_cocina', // Estado inicial
        timestamp: new Date(),
        createdAt: new Date(), // Para coincidir con tu estructura de datos
        activo: true
      };

      // Llamar a la función del padre para manejar el envío
      if (onEnviarPedido) {
        await onEnviarPedido(pedidoData);
      } else {
        // Fallback si no se proporciona la función del padre
        await addDoc(collection(db, 'pedidos'), pedidoData);
        mostrarMensaje('Pedido enviado a cocina');
      }

      // Opcional: Limpiar el pedido local después de enviarlo
      // setProductosPedido([]); // Descomenta si quieres limpiar el pedido después de enviarlo

    } catch (error) {
      console.error('Error al enviar pedido:', error);
      mostrarMensaje('Error al enviar el pedido');
    }
  };

  // Función para liberar la mesa (opcional - para cuando el mesero termina el servicio)
  const liberarMesa = async () => {
    if (productosPedido.length > 0) {
      if (!window.confirm('La mesa tiene productos en el pedido. ¿Estás seguro de liberarla?')) {
        return;
      }
    }

    try {
      // Actualizar estado de la mesa en Firebase
      const mesaRef = doc(db, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'libre' });

      // Limpiar el pedido local
      setProductosPedido([]);

      // Volver a la selección de mesas
      onVolver();
    } catch (error) {
      console.error('Error al liberar mesa:', error);
      mostrarMensaje('Error al liberar la mesa');
    }
  };

  return (
    <div className="pedido-activo">
      <div className="pedido-header">
        <button onClick={onVolver} className="volver-btn">← Volver</button>
        <h2>Pedido - Mesa {mesa.numero}</h2>
        <div className="mesa-info">
          <span className="estado-mesa">Estado: {mesa.estado}</span>
        </div>
      </div>

      <div className="pedido-contenido">
        {/* Catálogo de productos */}
        <div className="catalogo-productos">
          <div className="catalogo-header">
            <h3>Catálogo de Productos</h3>
            <div className="filtro-categorias">
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
          </div>

          <div className="productos-grid">
            {productosFiltrados.length === 0 ? (
              <div className="no-productos">
                <p>No hay productos en esta categoría</p>
              </div>
            ) : (
              productosFiltrados.map(producto => (
                <div key={producto.id} className="producto-card">
                  <div className="producto-info">
                    <h4>{producto.nombre}</h4>
                    <p className="producto-precio">${producto.precio?.toLocaleString()}</p>
                    <p className="producto-categoria">
                      <span className="categoria-tag">{producto.categoria}</span>
                    </p>
                    {producto.descripcion && (
                      <p className="producto-descripcion">{producto.descripcion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => agregarProducto(producto)}
                    className="btn-agregar"
                  >
                    Agregar +
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista de productos del pedido */}
        <div className="productos-lista">
          <h3>Productos del Pedido</h3>
          
          {productosPedido.length === 0 ? (
            <div className="lista-vacia">
              <p>No hay productos agregados aún</p>
              <p className="mensaje-informativo">Selecciona productos del catálogo para comenzar el pedido</p>
            </div>
          ) : (
            <div className="productos-pedido">
              {productosPedido.map((producto) => (
                <div key={producto.id} className="producto-pedido-item">
                  <div className="producto-detalle">
                    <span className="producto-nombre">{producto.nombre}</span>
                    <span className="producto-precio">${producto.precio?.toLocaleString()}</span>
                  </div>
                  
                  <div className="cantidad-control">
                    <button 
                      onClick={() => disminuirCantidad(producto.id)}
                      className="btn-cantidad"
                    >
                      -
                    </button>
                    <span className="cantidad">{producto.cantidad}</span>
                    <button 
                      onClick={() => aumentarCantidad(producto.id)}
                      className="btn-cantidad"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="producto-subtotal">
                    <span>${producto.subtotal?.toLocaleString()}</span>
                  </div>
                  
                  <button 
                    onClick={() => disminuirCantidad(producto.id)}
                    className="btn-eliminar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total acumulado */}
          <div className="total-acumulado">
            <div className="total-info">
              <h3>Total Acumulado</h3>
              <div className="total-valor">
                <span className="total-numero">${totalAcumulado.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="acciones-pedido">
              <button 
                onClick={enviarPedido}
                className="btn-enviar"
                disabled={productosPedido.length === 0}
              >
                Enviar a Cocina
              </button>
              <button 
                onClick={liberarMesa}
                className="btn-liberar"
              >
                Liberar Mesa
              </button>
            </div>
          </div>
        </div>
      </div>

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
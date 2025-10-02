// src/renderer/components/TomarPedido.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const TomarPedido = ({ carritoActual = [], onAgregarAlCarrito, onIrACaja, onBack }) => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('pizzas');
  const [loading, setLoading] = useState(true);

  // Cargar productos desde Firestore
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Productos'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductos(lista);
        if (lista.length > 0) {
          const primerCategoria = lista[0].categoria || 'pizzas';
          setCategoriaActiva(primerCategoria);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Agregar producto al carrito (notificar a App.js)
  const agregarProducto = (producto) => {
    onAgregarAlCarrito([{ ...producto, cantidad: 1 }]);
  };

  // Calcular totales usando el carrito recibido
  const total = carritoActual.reduce((sum, item) => sum + item.precio * (item.cantidad || 1), 0);
  const iva = Math.round(total * 0.19);
  const totalConIva = total + iva;

  const handleIrACaja = () => {
    if (carritoActual.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return;
    }
    onIrACaja(); // Solo navega, el carrito ya está en App.js
  };

  const productosFiltrados = productos.filter(p => p.categoria === categoriaActiva);
  const categoriasUnicas = [...new Set(productos.map(p => p.categoria))];

  return (
    <div className="tomar-pedido-container">
      {/* Encabezado con botón de volver */}
      <div className="pedido-header">
        <button className="btn-volver" onClick={onBack}>
          ← Volver
        </button>
        <h2>Tomar Pedido</h2>
      </div>

      {/* Contenido principal: 2 columnas */}
      <div className="pedido-content">
        {/* Columna izquierda: Productos */}
        <div className="productos-columna">
          {loading ? (
            <p className="cargando">Cargando menú...</p>
          ) : (
            <div className="productos-grid">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => (
                  <button
                    key={producto.id}
                    className="producto-btn"
                    onClick={() => agregarProducto(producto)}
                  >
                    {producto.nombre}
                  </button>
                ))
              ) : (
                <p>No hay productos en esta categoría.</p>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: Resumen de orden */}
        <div className="orden-columna">
          <div className="orden-panel">
            <h3>Orden</h3>
            {carritoActual.length === 0 ? (
              <p>No hay productos en la orden.</p>
            ) : (
              <>
                <div className="orden-lista">
                  <div className="orden-header">
                    <strong>ARTÍCULO</strong>
                    <strong>PRECIO</strong>
                  </div>
                  {carritoActual.map(item => (
                    <div key={item.id} className="orden-item">
                      <span>{item.nombre} x{item.cantidad || 1}</span>
                      <span>${(item.precio * (item.cantidad || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="orden-totales">
                  <div className="total-row">
                    <span>Precio total $:</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span>IVA $:</span>
                    <span>${iva.toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span>Total con IVA:</span>
                    <span>${totalConIva.toLocaleString()}</span>
                  </div>
                </div>
                <button className="btn-ingresar" onClick={handleIrACaja}>
                  Ingresar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de categorías en la parte inferior */}
      <div className="categorias-barra">
        {categoriasUnicas.map(categoria => (
          <button
            key={categoria}
            className={`categoria-btn ${categoriaActiva === categoria ? 'active' : ''}`}
            onClick={() => setCategoriaActiva(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TomarPedido;
// src/renderer/components/TomarPedido.js
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ✅ Mismas categorías que en ProductosModule.js
const CATEGORIAS = [
  { value: 'platos', label: 'Platillos' },
  { value: 'bebida', label: 'Bebestibles' },
  { value: 'postre', label: 'Postres' },
  { value: 'acompañamiento', label: 'Acompañamientos' },
  { value: 'combos', label: 'Combos' }
];

const TomarPedido = ({ 
  carritoActual = [], 
  onAgregarAlCarrito, 
  onEliminarDelCarrito, // ✅ Recibimos la función del padre
  onIrACaja, 
  onBack 
}) => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0].value);
  const [loading, setLoading] = useState(true);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(19);
  const [carritoLocal, setCarritoLocal] = useState([]);

  // Sincronizar carrito local con el carrito del padre
  useEffect(() => {
    setCarritoLocal(carritoActual);
  }, [carritoActual]);

  // Cargar configuración (IVA)
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'config', 'app'));
        if (configDoc.exists()) {
          const config = configDoc.data();
          setIvaPorcentaje(config.impuesto || 19);
        }
      } catch (error) {
        console.warn('No se pudo cargar la configuración. Usando IVA por defecto (19%).');
      }
    };
    cargarConfiguracion();
  }, []);

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Productos'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductos(lista);

        const primeraValida = CATEGORIAS.find(cat => 
          lista.some(p => p.categoria === cat.value)
        );
        if (primeraValida) {
          setCategoriaActiva(primeraValida.value);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const agregarProducto = (producto) => {
    const nuevoItem = { ...producto, cantidad: 1 };
    setCarritoLocal(prev => [...prev, nuevoItem]);
    onAgregarAlCarrito([nuevoItem]);
  };

  // ✅ Corregido: ahora notifica al padre
  const eliminarProducto = (id) => {
    setCarritoLocal(prev => prev.filter(item => item.id !== id));
    onEliminarDelCarrito(id); // ← Esto actualiza el carrito en App.js
  };

  // Cálculos de totales
  const subtotal = useMemo(() =>
    carritoLocal.reduce((sum, item) => sum + item.precio * (item.cantidad || 1), 0),
    [carritoLocal]
  );
  const iva = useMemo(() => Math.round(subtotal * (ivaPorcentaje / 100)), [subtotal, ivaPorcentaje]);
  const total = subtotal + iva;

  const handleIrACaja = () => {
    if (carritoLocal.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return;
    }
    onIrACaja();
  };

  const productosFiltrados = productos.filter(p => p.categoria === categoriaActiva);
  const categoriasDisponibles = CATEGORIAS.filter(cat =>
    productos.some(p => p.categoria === cat.value)
  );

  return (
    <div className="tomar-pedido-container">
      <div className="pedido-header">
        <button className="btn-volver" onClick={onBack}> Volver </button>
        <h2>Tomar Pedido</h2>
      </div>

      <div className="pedido-content">
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

        <div className="orden-columna">
          <div className="orden-panel">
            <h3>Orden</h3>
            {carritoLocal.length === 0 ? (
              <p>No hay productos en la orden.</p>
            ) : (
              <>
                <div className="orden-lista">
                  <div className="orden-header">
                    <strong>ARTÍCULO</strong>
                    <strong>ACCIONES</strong>
                  </div>
                  {carritoLocal.map(item => (
                    <div key={item.id} className="orden-item">
                      <span>{item.nombre} x{item.cantidad || 1}</span>
                      <div className="acciones-item">
                        <span className="precio-item">
                          ${(item.precio * (item.cantidad || 1)).toLocaleString()}
                        </span>
                        <button
                          className="btn-eliminar-item"
                          onClick={() => eliminarProducto(item.id)}
                          aria-label="Eliminar producto"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="orden-totales">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span>IVA ({ivaPorcentaje}%)</span>
                    <span>${iva.toLocaleString()}</span>
                  </div>
                  <div className="total-row total-final">
                    <span>Total:</span>
                    <span>${total.toLocaleString()}</span>
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

      <div className="categorias-barra">
        {categoriasDisponibles.map(categoria => (
          <button
            key={categoria.value}
            className={`categoria-btn ${categoriaActiva === categoria.value ? 'active' : ''}`}
            onClick={() => setCategoriaActiva(categoria.value)}
          >
            {categoria.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TomarPedido;
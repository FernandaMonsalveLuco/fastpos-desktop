// src/renderer/components/TomarPedido.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import PedidoActivo from './pedidoActivo';

const CATEGORIAS = [
  { value: 'platos', label: 'Platillos' },
  { value: 'bebida', label: 'Bebestibles' },
  { value: 'postre', label: 'Postres' },
  { value: 'acompañamiento', label: 'Acompañamientos' },
  { value: 'combos', label: 'Combos' },
  { value: 'otros', label: 'Otros' }
];

// ======================
// Componente: SeleccionarMesa
// ======================
const SeleccionarMesa = ({ mesas, onSelect }) => {
  return (
    <div className="seleccionar-mesa">
      <h2>Selecciona una mesa</h2>
      <div className="mesas-grid">
        {mesas.map(mesa => (
          <button
            key={mesa.id}
            className={`mesa-btn ${mesa.estado === 'ocupada' ? 'ocupada' : ''}`}
            onClick={() => onSelect(mesa)}
            disabled={mesa.estado === 'ocupada'}
          >
            Mesa {mesa.numero}
            {mesa.estado === 'ocupada' && ' (ocupada)'}
          </button>
        ))}
      </div>
    </div>
  );
};

// ======================
// Componente principal: TomarPedido
// ======================
const TomarPedido = ({ onBack }) => {
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0].value);
  const [loading, setLoading] = useState(true);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(19);
  const [carritoLocal, setCarritoLocal] = useState([]);

  // === Cargar mesas ===
  useEffect(() => {
    const cargarMesas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'mesas'));
        const listaMesas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMesas(listaMesas);
      } catch (error) {
        console.error('Error al cargar mesas:', error);
        alert('No se pudieron cargar las mesas.');
      }
    };
    cargarMesas();
  }, []);

  // === Cargar configuración (IVA) ===
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

  // === Cargar productos ===
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
        alert('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // === Seleccionar mesa ===
  const seleccionarMesa = async (mesa) => {
    if (mesa.estado !== 'libre') {
      alert('Esta mesa ya está ocupada');
      return;
    }
    try {
      const mesaRef = doc(db, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'ocupada' });

      const mesaActualizada = { ...mesa, estado: 'ocupada' };
      setMesaSeleccionada(mesaActualizada);
      setMesas(prev => prev.map(m => (m.id === mesa.id ? mesaActualizada : m)));
      setCarritoLocal([]);
    } catch (error) {
      console.error('Error al marcar mesa como ocupada:', error);
      alert('No se pudo abrir la mesa. Inténtalo de nuevo.');
    }
  };

  // === Carrito ===
  const agregarProducto = (producto) => {
    const nuevoItem = { ...producto, cantidad: 1 };
    setCarritoLocal(prev => [...prev, nuevoItem]);
  };

  const eliminarProducto = (id) => {
    setCarritoLocal(prev => prev.filter(item => item.id !== id));
  };

  // === Cálculos de totales ===
  const subtotal = carritoLocal.reduce((sum, item) => sum + item.precio * (item.cantidad || 1), 0);
  const iva = Math.round(subtotal * (ivaPorcentaje / 100));
  const total = subtotal + iva;

  // === Enviar pedido con validaciones ===
  const handleEnviarPedido = async () => {
    // 🔴 Validación: mesa seleccionada
    if (!mesaSeleccionada) {
      alert('Por favor, selecciona una mesa antes de enviar el pedido.');
      return;
    }

    // 🔴 Validación: pedido no vacío
    if (carritoLocal.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return;
    }

    // 🟡 Confirmación opcional
    if (!window.confirm(`¿Enviar pedido de la Mesa ${mesaSeleccionada.numero} a cocina?\nTotal: $${total.toLocaleString()}`)) {
      return;
    }

    try {
      const nuevoPedido = {
        mesaId: mesaSeleccionada.id,
        mesaNumero: mesaSeleccionada.numero,
        items: carritoLocal,
        subtotal,
        iva,
        total,
        estado: 'en_cocina',
        pagado: false,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'pedidos'), nuevoPedido);
      setCarritoLocal([]);
      alert('✅ ¡Pedido enviado a cocina!');
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      alert('No se pudo enviar el pedido. Verifica tu conexión.');
    }
  };

  // === Filtros ===
  const productosFiltrados = productos
    .filter(p => p.categoria === categoriaActiva)
    .filter(p => p.activo !== false);

  const categoriasDisponibles = CATEGORIAS.filter(cat =>
    productos.some(p => p.categoria === cat.value)
  );

  // === Renderizado ===
  if (!mesaSeleccionada) {
    return (
      <div className="tomar-pedido-container">
        <div className="pedido-header">
          <button className="btn-volver" onClick={onBack}>← Volver</button>
          <h2>Tomar Pedido</h2>
        </div>
        <SeleccionarMesa mesas={mesas} onSelect={seleccionarMesa} />
      </div>
    );
  }

  return (
    <div className="tomar-pedido-container">
      <div className="pedido-header">
        <button className="btn-volver" onClick={() => setMesaSeleccionada(null)}>
          ← Cambiar mesa
        </button>
        <h2>Menú - Mesa {mesaSeleccionada.numero}</h2>
      </div>

      <div className="pedido-content">
        {/* Columna de productos */}
        <div className="productos-columna">
          {loading ? (
            <p className="cargando">Cargando menú...</p>
          ) : productosFiltrados.length > 0 ? (
            <div className="productos-grid">
              {productosFiltrados.map(producto => (
                <div key={producto.id} className="producto-card">
                  <div className="producto-info">
                    <strong>{producto.nombre}</strong>
                    <span className="producto-precio">
                      ${producto.precio.toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="btn-agregar-producto"
                    onClick={() => agregarProducto(producto)}
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="sin-productos">No hay productos en esta categoría.</p>
          )}
        </div>

        {/* Columna de pedido activo */}
        <div className="orden-columna">
          <PedidoActivo
            mesaNumero={mesaSeleccionada.numero}
            items={carritoLocal}
            ivaPorcentaje={ivaPorcentaje}
            onEliminarItem={eliminarProducto}
          />
          <button 
            className="btn-ingresar"
            onClick={handleEnviarPedido}
            disabled={carritoLocal.length === 0}
          >
            🍳 Enviar a Cocina
          </button>
        </div>
      </div>

      {/* Barra de categorías */}
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
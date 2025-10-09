// src/renderer/components/ProductosModule.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIAS = [
  { value: 'platos', label: 'Platillos' },
  { value: 'bebida', label: 'Bebestibles' },
  { value: 'postre', label: 'Postres' },
  { value: 'acompañamiento', label: 'Acompañamientos' },
  { value: 'combos', label: 'Combos' },
  { value: 'otros', label: 'Otros'}
];


const ProductosModule = ({ onBack }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    categoria: CATEGORIAS[0].value,
    insumos: [], // [{ nombre: 'Masa pizza', cantidad: 1 }]
  });

  const [nuevoInsumo, setNuevoInsumo] = useState({ nombre: '', cantidad: '' });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Productos'));
        const productosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          insumos: doc.data().insumos || [],
        }));
        setProductos(productosList);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInsumoChange = (field, value) => {
    setNuevoInsumo(prev => ({ ...prev, [field]: value }));
  };

  const agregarInsumo = () => {
    const { nombre, cantidad } = nuevoInsumo;
    if (!nombre.trim() || !cantidad || isNaN(cantidad) || parseFloat(cantidad) <= 0) {
      alert('Ingresa un nombre y una cantidad válida para el insumo.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      insumos: [...prev.insumos, { nombre: nombre.trim(), cantidad: parseFloat(cantidad) }]
    }));

    setNuevoInsumo({ nombre: '', cantidad: '' });
  };

  const eliminarInsumo = (index) => {
    setFormData(prev => ({
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, precio, descripcion, categoria, insumos } = formData;

    if (!nombre || !precio || !categoria) {
      alert('Nombre, precio y categoría son obligatorios');
      return;
    }

    try {
      const datosProducto = {
        nombre,
        precio: parseFloat(precio),
        descripcion: descripcion || '',
        categoria,
        insumos, // Guardamos los insumos
      };

      if (editando) {
        await updateDoc(doc(db, 'Productos', editando), datosProducto);
        setProductos(prev =>
          prev.map(p => p.id === editando ? { ...p, ...datosProducto } : p)
        );
      } else {
        const docRef = await addDoc(collection(db, 'Productos'), {
          ...datosProducto,
          createdAt: new Date(),
        });
        setProductos(prev => [...prev, { id: docRef.id, ...datosProducto, createdAt: new Date() }]);
      }

      setFormData({
        nombre: '',
        precio: '',
        descripcion: '',
        categoria: CATEGORIAS[0].value,
        insumos: [],
      });
      setNuevoInsumo({ nombre: '', cantidad: '' });
      setShowForm(false);
      setEditando(null);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert('Error al guardar el producto');
    }
  };

  const handleEditar = (producto) => {
    setEditando(producto.id);
    setFormData({
      nombre: producto.nombre || '',
      precio: producto.precio ? producto.precio.toString() : '',
      descripcion: producto.descripcion || '',
      categoria: CATEGORIAS.some(cat => cat.value === producto.categoria)
        ? producto.categoria
        : CATEGORIAS[0].value,
      insumos: Array.isArray(producto.insumos) ? producto.insumos : [],
    });
    setNuevoInsumo({ nombre: '', cantidad: '' });
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await deleteDoc(doc(db, 'Productos', id));
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      alert('Error al eliminar el producto');
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({
      nombre: '',
      precio: '',
      descripcion: '',
      categoria: CATEGORIAS[0].value,
      insumos: [],
    });
    setNuevoInsumo({ nombre: '', cantidad: '' });
  };

  return (
    <div className="productos-module">
      <h2>Gestión de Productos</h2>
      <div className="acciones-productos">
        <button className="btn-agregar" onClick={() => setShowForm(true)}>
          {editando ? 'Editar Producto' : 'Agregar Producto'}
        </button>
        <button className="btn-volver" onClick={onBack}>
          Volver
        </button>
      </div>

      {showForm && (
        <form className="formulario-producto" onSubmit={handleSubmit}>
          <h3>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h3>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre del producto"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="precio"
            placeholder="Precio"
            value={formData.precio}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />

          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
          >
            {CATEGORIAS.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <textarea
            name="descripcion"
            placeholder="Descripción (opcional)"
            value={formData.descripcion}
            onChange={handleChange}
          />

          {/* Sección de Insumos */}
          <div className="insumos-section">
            <h4>Insumos requeridos (por unidad vendida)</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Nombre del insumo (ej. Masa pizza)"
                value={nuevoInsumo.nombre}
                onChange={(e) => handleInsumoChange('nombre', e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                type="number"
                placeholder="Cantidad"
                value={nuevoInsumo.cantidad}
                onChange={(e) => handleInsumoChange('cantidad', e.target.value)}
                min="0.01"
                step="0.01"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={agregarInsumo} style={{ padding: '6px 10px' }}>
                +
              </button>
            </div>

            {formData.insumos.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' }}>
                {formData.insumos.map((insumo, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>{insumo.nombre} × {insumo.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => eliminarInsumo(index)}
                      style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-guardar">
              {editando ? 'Actualizar' : 'Guardar'}
            </button>
            <button type="button" className="btn-cancelar" onClick={handleCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <div className="productos-lista">
          {productos.length === 0 ? (
            <p>No hay productos registrados.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Categoría</th>
                  <th>Insumos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio?.toFixed(2) || '0.00'}</td>
                    <td>
                      {CATEGORIAS.find(c => c.value === producto.categoria)?.label || producto.categoria || '—'}
                    </td>
                    <td>
                      {producto.insumos && producto.insumos.length > 0
                        ? producto.insumos.map(i => `${i.nombre}×${i.cantidad}`).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <button className="btn-editar" onClick={() => handleEditar(producto)}>
                        Editar
                      </button>
                      <button className="btn-eliminar" onClick={() => handleEliminar(producto.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductosModule;
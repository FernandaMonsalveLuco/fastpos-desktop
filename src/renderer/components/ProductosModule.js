// src/renderer/components/ProductosModule.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// ✅ Definimos las categorías disponibles
const CATEGORIAS = [
  { value: 'platos', label: 'Platillos' },
  { value: 'bebida', label: 'Bebestibles' },
  { value: 'postre', label: 'Postres' },
  { value: 'acompañamiento', label: 'Acompañamientos' },
  { value: 'combos', label: 'Combos' }
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
  });

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Productos'));
        const productosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, precio, descripcion, categoria } = formData;

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
      };

      if (editando) {
        // ✅ Actualizar en Firebase
        await updateDoc(doc(db, 'Productos', editando), datosProducto);
        // ✅ Actualizar en el estado local (conservando otros campos)
        setProductos(prev =>
          prev.map(p => p.id === editando ? { ...p, ...datosProducto } : p)
        );
      } else {
        // ✅ Crear nuevo producto
        const docRef = await addDoc(collection(db, 'Productos'), {
          ...datosProducto,
          createdAt: new Date(),
        });
        setProductos(prev => [...prev, { id: docRef.id, ...datosProducto, createdAt: new Date() }]);
      }

      // Reset form
      setFormData({
        nombre: '',
        precio: '',
        descripcion: '',
        categoria: CATEGORIAS[0].value
      });
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
      // ✅ Aseguramos que la categoría sea válida
      categoria: CATEGORIAS.some(cat => cat.value === producto.categoria)
        ? producto.categoria
        : CATEGORIAS[0].value,
    });
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
      categoria: CATEGORIAS[0].value
    });
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
          
          {/* Selector de categoría */}
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
                  <th>Descripción</th>
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
                    <td>{producto.descripcion || '—'}</td>
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
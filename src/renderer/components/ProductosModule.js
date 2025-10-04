// src/renderer/components/ProductosModule.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de que esta ruta sea correcta

const ProductosModule = ({ onBack }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null); // ID del producto que se está editando
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: ''
  });

  // Cargar productos al montar
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
    const { nombre, precio, descripcion } = formData;

    if (!nombre || !precio) {
      alert('Nombre y precio son obligatorios');
      return;
    }

    try {
      if (editando) {
        // Actualizar
        await updateDoc(doc(db, 'Productos', editando), {
          nombre,
          precio: parseFloat(precio),
          descripcion: descripcion || ''
        });
        setProductos(prev => 
          prev.map(p => p.id === editando ? { id: editando, nombre, precio: parseFloat(precio), descripcion: descripcion || '' } : p)
        );
      } else {
        // Crear
        const docRef = await addDoc(collection(db, 'Productos'), {
          nombre,
          precio: parseFloat(precio),
          descripcion: descripcion || '',
          createdAt: new Date()
        });
        setProductos(prev => [...prev, { id: docRef.id, nombre, precio: parseFloat(precio), descripcion: descripcion || '' }]);
      }

      // Reset
      setFormData({ nombre: '', precio: '', descripcion: '' });
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
      nombre: producto.nombre,
      precio: producto.precio.toString(),
      descripcion: producto.descripcion || ''
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
    setFormData({ nombre: '', precio: '', descripcion: '' });
  };

  return (
    <div className="productos-module">
      <h2>Gestión de Productos</h2>
      

      <div className="acciones-productos">
        <button className="btn-agregar" onClick={() => setShowForm(true)}>
          {editando ? 'Editar Producto' : 'Agregar Producto'}
        </button>
        <button className="btn-volver" onClick={onBack}> Volver</button>
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
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio.toFixed(2)}</td>
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
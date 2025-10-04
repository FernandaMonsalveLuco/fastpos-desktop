<<<<<<< HEAD
// src/renderer/components/usuarios/UsuariosModule.js
import React, { useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateEmail,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../firebase';

const UsuariosModule = ({ onBack }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol: 'user'
  });

  // Cargar usuarios al montar
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Usuarios'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(lista);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, rol } = formData;

    try {
      if (editando) {
        // Actualizar usuario existente
        const userDocRef = doc(db, 'Usuarios', editando);
        await updateDoc(userDocRef, { name, rol });

        // Si el email cambió, actualizar en Auth (opcional y complejo)
        // Por simplicidad, no permitimos cambiar email aquí

        setUsuarios(prev => 
          prev.map(u => u.id === editando ? { ...u, name, rol } : u)
        );
      } else {
        // Crear nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Guardar en Firestore
        await setDoc(doc(db, 'Usuarios', uid), {
          name,
          email,
          rol,
          createdAt: new Date()
        });

        setUsuarios(prev => [...prev, { id: uid, name, email, rol }]);
      }

      // Reset
      setFormData({ name: '', email: '', password: '', rol: 'user' });
      setShowForm(false);
      setEditando(null);
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      let mensaje = 'Error al guardar el usuario';
      if (err.code === 'auth/email-already-in-use') {
        mensaje = 'El correo ya está en uso';
      } else if (err.code === 'auth/invalid-email') {
        mensaje = 'Correo inválido';
      } else if (err.code === 'auth/weak-password') {
        mensaje = 'La contraseña debe tener al menos 6 caracteres';
      }
      setError(mensaje);
    }
  };

  const handleEditar = (usuario) => {
    setEditando(usuario.id);
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: '', // No se muestra la contraseña
      rol: usuario.rol || 'user'
    });
    setShowForm(true);
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar al usuario ${usuario.name}? Esta acción no se puede deshacer.`)) return;

    try {
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'Usuarios', usuario.id));

      // Opcional: eliminar de Firebase Auth (requiere privilegios elevados)
      // Nota: Esto solo funciona si el usuario actual es admin y tiene permisos
      // En la mayoría de apps, se deja el usuario en Auth pero se elimina de Firestore

      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('No se pudo eliminar el usuario');
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({ name: '', email: '', password: '', rol: 'user' });
    setError(null);
  };

  return (
    <div className="usuarios-module">
      <h2>Gestión de Usuarios</h2>
      

      <div className="acciones-usuarios">
        <button className="btn-agregar" onClick={() => setShowForm(true)}>
          {editando ? 'Editar Usuario' : 'Agregar Usuario'}
        </button>
        <button className="btn-volver" onClick={onBack}>
          Volver
        </button>
      </div>

      {showForm && (
        <form className="formulario-usuario" onSubmit={handleSubmit}>
          <h3>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!editando} // No permitir cambiar email al editar
          />
          
          {!editando && (
            <input
              type="password"
              name="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          )}
          
          <select
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>

          {error && <p className="error-form">{error}</p>}

          <div className="form-buttons">
            <button type="submit" className="btn-guardar">
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" className="btn-cancelar" onClick={handleCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="lista-usuarios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.name}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</td>
                  <td>
                    <button className="btn-editar" onClick={() => handleEditar(usuario)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(usuario)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

=======
// src/renderer/components/usuarios/UsuariosModule.js
import React, { useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateEmail,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../firebase';

const UsuariosModule = ({ onBack }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol: 'user'
  });

  // Cargar usuarios al montar
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Usuarios'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(lista);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, rol } = formData;

    try {
      if (editando) {
        // Actualizar usuario existente
        const userDocRef = doc(db, 'Usuarios', editando);
        await updateDoc(userDocRef, { name, rol });

        // Si el email cambió, actualizar en Auth (opcional y complejo)
        // Por simplicidad, no permitimos cambiar email aquí

        setUsuarios(prev => 
          prev.map(u => u.id === editando ? { ...u, name, rol } : u)
        );
      } else {
        // Crear nuevo usuario
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Guardar en Firestore
        await setDoc(doc(db, 'Usuarios', uid), {
          name,
          email,
          rol,
          createdAt: new Date()
        });

        setUsuarios(prev => [...prev, { id: uid, name, email, rol }]);
      }

      // Reset
      setFormData({ name: '', email: '', password: '', rol: 'user' });
      setShowForm(false);
      setEditando(null);
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      let mensaje = 'Error al guardar el usuario';
      if (err.code === 'auth/email-already-in-use') {
        mensaje = 'El correo ya está en uso';
      } else if (err.code === 'auth/invalid-email') {
        mensaje = 'Correo inválido';
      } else if (err.code === 'auth/weak-password') {
        mensaje = 'La contraseña debe tener al menos 6 caracteres';
      }
      setError(mensaje);
    }
  };

  const handleEditar = (usuario) => {
    setEditando(usuario.id);
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: '', // No se muestra la contraseña
      rol: usuario.rol || 'user'
    });
    setShowForm(true);
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar al usuario ${usuario.name}? Esta acción no se puede deshacer.`)) return;

    try {
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'Usuarios', usuario.id));

      // Opcional: eliminar de Firebase Auth (requiere privilegios elevados)
      // Nota: Esto solo funciona si el usuario actual es admin y tiene permisos
      // En la mayoría de apps, se deja el usuario en Auth pero se elimina de Firestore

      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('No se pudo eliminar el usuario');
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditando(null);
    setFormData({ name: '', email: '', password: '', rol: 'user' });
    setError(null);
  };

  return (
    <div className="usuarios-module">
      <h2>Gestión de Usuarios</h2>
      <button className="btn-volver" onClick={onBack}>← Volver</button>

      <div className="acciones-usuarios">
        <button className="btn-agregar" onClick={() => setShowForm(true)}>
          {editando ? 'Editar Usuario' : 'Agregar Usuario'}
        </button>
      </div>

      {showForm && (
        <form className="formulario-usuario" onSubmit={handleSubmit}>
          <h3>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          
          <input
            type="text"
            name="name"
            placeholder="Nombre completo"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!editando} // No permitir cambiar email al editar
          />
          
          {!editando && (
            <input
              type="password"
              name="password"
              placeholder="Contraseña (mín. 6 caracteres)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          )}
          
          <select
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>

          {error && <p className="error-form">{error}</p>}

          <div className="form-buttons">
            <button type="submit" className="btn-guardar">
              {editando ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" className="btn-cancelar" onClick={handleCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="lista-usuarios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td>{usuario.name}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</td>
                  <td>
                    <button className="btn-editar" onClick={() => handleEditar(usuario)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleEliminar(usuario)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
export default UsuariosModule;
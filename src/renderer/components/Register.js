import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Register = ({ onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, rol } = e.target.elements;

    setLoading(true);
    try {
      await addDoc(collection(db, 'Usuarios'), {
        name: name.value,
        email: email.value,
        password: password.value,
        rol: rol.value,
        createdAt: serverTimestamp()
      });
      setMessage('Usuario creado exitosamente');
      onRegisterSuccess();
    } catch (err) {
      setMessage('Error al crear usuario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Crear Usuario</h2>
      {message && <p className={message.includes('Error') ? 'error' : 'success'}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Contraseña" required minLength="6" />
        <select name="rol" defaultValue="user">
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>
    </div>
  );
};

export default Register;
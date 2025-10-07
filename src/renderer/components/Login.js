// src/renderer/components/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = ({ onLogin, onShowRegister, onShowForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onLogin({
        uid: user.uid,
        email: user.email,
        name: user.displayName || email.split('@')[0], 
      });
    } catch (err) {
      console.error('Error en login:', err);
      let message = 'Error al iniciar sesión.';
      if (err.code === 'auth/invalid-credential') {
        message = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Usuario no encontrado.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Contraseña incorrecta.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn-ingresar"
          disabled={loading}
          style={{ width: '100%', marginBottom: '12px' }}
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      <div className="forgot-password" style={{ marginBottom: '12px', textAlign: 'center' }}>
  ¿Olvidaste tu contraseña?{' '}
  <span 
    className="forgot-link" 
    onClick={onShowForgotPassword}
    style={{ fontWeight: 'bold', color: '#e0a800', cursor: 'pointer'}}
  >
    Recuperar
  </span>
</div>
    </div>
  );
};

export default Login;
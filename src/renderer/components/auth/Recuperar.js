// src/renderer/components/auth/Recuperar.js
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase'; 

const Recuperar = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo válido.');
      return;
    }

    setLoading(true);
    setError('');
    setMensaje('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMensaje(`Se ha enviado un enlace de restablecimiento a ${email}. Revisa tu bandeja de entrada (y spam).`);
    } catch (err) {
      console.error('Error al enviar correo de recuperación:', err);
      let message = 'No se pudo enviar el correo de recuperación.';
      if (err.code === 'auth/invalid-email') {
        message = 'El correo ingresado no es válido.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No existe una cuenta asociada a este correo.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-container">
      <h2>Recuperar Contraseña</h2>
      <button className="btn-volver" onClick={onBack} style={{ marginBottom: '16px' }}>
        ← Volver
      </button>

      {mensaje && <p className="success" style={{ marginBottom: '16px' }}>{mensaje}</p>}
      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email-recuperar">Correo electrónico</label>
          <input
            id="email-recuperar"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@ejemplo.com"
            disabled={loading}
            style={{ width: '100%', padding: '10px', marginBottom: '12px' }}
          />
        </div>

        <button
          type="submit"
          className="btn-enviar"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#e0a800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>
    </div>
  );
};

export default Recuperar;
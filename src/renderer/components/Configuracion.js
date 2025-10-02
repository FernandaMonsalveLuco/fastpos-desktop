// src/renderer/components/Configuracion.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Configuracion = ({ onBack }) => {
  const [config, setConfig] = useState({
    nombreNegocio: 'FastPOS',
    impuesto: 19,
    moneda: 'COP',
    modoImpresion: 'ticket',
    notificaciones: true
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const docRef = doc(db, 'config', 'app');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data());
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      await setDoc(doc(db, 'config', 'app'), config);
      setMensaje('Configuración guardada exitosamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setMensaje('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="configuracion-module">
        <button className="btn-volver" onClick={onBack}>← Volver</button>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="configuracion-module">
      <h2>Configuración</h2>
      <button className="btn-volver" onClick={onBack}>← Volver</button>

      <form onSubmit={handleSubmit} className="formulario-config">
        <div className="form-group">
          <label>Nombre del Negocio</label>
          <input
            type="text"
            name="nombreNegocio"
            value={config.nombreNegocio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Impuesto (%)</label>
          <input
            type="number"
            name="impuesto"
            value={config.impuesto}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            required
          />
        </div>

        <div className="form-group">
            <label>Moneda</label>
            <select name="moneda" value={config.moneda} onChange={handleChange}>
                <option value="CLP">Pesos Chilenos (CLP)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="EUR">Euros (EUR)</option>
            </select>
        </div>

        <div className="form-group">
          <label>Modo de impresión</label>
          <select name="modoImpresion" value={config.modoImpresion} onChange={handleChange}>
            <option value="ticket">Ticket térmico</option>
            <option value="factura">Factura completa</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="notificaciones"
              checked={config.notificaciones}
              onChange={handleChange}
            />
            Activar notificaciones en escritorio
          </label>
        </div>

        {mensaje && <p className={`mensaje ${mensaje.includes('Error') ? 'error' : 'success'}`}>{mensaje}</p>}

        <button
          type="submit"
          className="btn-guardar"
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
};

export default Configuracion;
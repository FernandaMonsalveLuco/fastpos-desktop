// src/components/Caja.js
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';

const Caja = ({ user, carrito, onBack, onVaciarCarrito }) => {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Usamos `carrito` directamente desde las props (no estado local)
  const items = carrito; // Asumimos que cada item ya tiene: id, nombre, precio, cantidad

  const total = items.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);

  const handlePagar = async () => {
    if (items.length === 0) {
      setMensaje('No hay productos para registrar.');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const venta = {
        fecha: serverTimestamp(),
        cajeroId: currentUser.uid,
        cajeroNombre: user?.name || 'Desconocido',
        productos: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad || 1,
          subtotal: item.precio * (item.cantidad || 1),
        })),
        total: total,
        estado: 'completada',
        tipo: 'pizzeria',
      };

      const docRef = await addDoc(collection(db, 'ventas'), venta);

      setMensaje(`Venta registrada con éxito. ID: ${docRef.id}`);
      console.log('Venta guardada en Firestore con ID:', docRef.id);

      // Opcional: vaciar el carrito después de pagar
      if (onVaciarCarrito) {
        onVaciarCarrito();
      }

    } catch (error) {
      console.error('Error al guardar la venta:', error);
      setMensaje('Error al registrar la venta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="caja-container">
      {mensaje && (
        <p
          className={mensaje.includes('éxito') ? 'success' : 'error'}
          style={{ marginBottom: '16px', textAlign: 'center' }}
        >
          {mensaje}
        </p>
      )}

      <div
        className="seccion"
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(90, 90, 90, 0.45)',
          backgroundColor: '#f9f9f9',
                    margin: '20px auto',
          backgroundColor: '#fff',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>
          Caja - Pizzería FastPOS
        </h2>
        <h3 style={{ marginBottom: '12px' }}>Orden</h3>
        {items.length === 0 ? (
          <p>No hay productos en la orden.</p>
        ) : (
          <div className="pedido-item">
            {items.map((item) => (
              <div key={item.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{item.nombre}</strong>
                  <span>
                    {(item.cantidad || 1)} x ${item.precio.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    color: '#666',
                    fontSize: '14px',
                  }}
                >
                  Subtotal: ${ (item.precio * (item.cantidad || 1)).toLocaleString() }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOTALES */}
      <div
        className="totales"
        style={{
          maxWidth: '600px',
          margin: '20px auto',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 8px rgba(90, 90, 90, 0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          <span>Total a pagar:</span>
          <span>${total.toLocaleString()}</span>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn-pagar"
            onClick={handlePagar}
            disabled={loading || items.length === 0}
            style={{ width: '100%', marginBottom: '12px' }}
          >
            {loading ? 'Procesando...' : 'Pagar Pedido'}
          </button>
          <button className="btn-volver" onClick={onBack}>
<<<<<<< HEAD
            Volver
=======
            ← Volver
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
          </button>
        </div>
      </div>
    </div>
  );
};

export default Caja;
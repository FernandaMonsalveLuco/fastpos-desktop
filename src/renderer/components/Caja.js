// src/renderer/components/Caja.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

const Caja = ({ user, onBack }) => {
  const [pedidosActivos, setPedidosActivos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mesas, setMesas] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);

  // Cargar pedidos no pagados y mesas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Pedidos con estado 'en_cocina' o 'listo', no pagados
        const q = query(
          collection(db, 'pedidos'),
          where('pagado', '==', false)
        );
        const pedidosSnap = await getDocs(q);
        const pedidos = pedidosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cargar mesas para liberar después
        const mesasSnap = await getDocs(collection(db, 'mesas'));
        const mapaMesas = {};
        mesasSnap.docs.forEach(doc => {
          mapaMesas[doc.id] = doc.data();
        });

        setPedidosActivos(pedidos);
        setMesas(mapaMesas);
      } catch (error) {
        console.error('Error al cargar datos en caja:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const procesarPago = async () => {
    if (!pedidoSeleccionado) {
      alert('Selecciona un pedido primero');
      return;
    }

    if (pagando) return;
    setPagando(true);

    try {
      // 1. Crear venta en 'ventas'
      const ventaData = {
        ...pedidoSeleccionado,
        estado: 'completada',
        pagado: true,
        timestampPago: new Date(),
        cajeroId: user?.uid,
        cajeroNombre: user?.name || user?.email
      };
      await addDoc(collection(db, 'ventas'), ventaData);

      // 2. Actualizar pedido como pagado
      await updateDoc(doc(db, 'pedidos', pedidoSeleccionado.id), {
        pagado: true,
        timestampPago: new Date()
      });

      // 3. Liberar la mesa
      if (pedidoSeleccionado.mesaId) {
        await updateDoc(doc(db, 'mesas', pedidoSeleccionado.mesaId), {
          estado: 'libre'
        });
      }

      alert('✅ Pago procesado y mesa liberada.');
      onBack(); // volver al dashboard

    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Hubo un error al procesar el pago.');
    } finally {
      setPagando(false);
    }
  };

  return (
    <div className="caja-container">
      <div className="caja-header">
        <button onClick={onBack}>← Volver</button>
        <h2>Caja</h2>
      </div>

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : pedidosActivos.length === 0 ? (
        <p>No hay pedidos pendientes de pago.</p>
      ) : (
        <div className="caja-content">
          <div className="pedidos-lista">
            <h3>Pedidos pendientes</h3>
            {pedidosActivos.map(pedido => (
              <div
                key={pedido.id}
                className={`pedido-item ${pedidoSeleccionado?.id === pedido.id ? 'seleccionado' : ''}`}
                onClick={() => setPedidoSeleccionado(pedido)}
              >
                <strong>Mesa {pedido.mesaNumero}</strong>
                <div>Total: ${pedido.total?.toLocaleString()}</div>
                <div>Estado: {pedido.estado}</div>
              </div>
            ))}
          </div>

          {pedidoSeleccionado && (
            <div className="detalle-pedido">
              <h3>Detalle - Mesa {pedidoSeleccionado.mesaNumero}</h3>
              <ul>
                {pedidoSeleccionado.items?.map((item, i) => (
                  <li key={i}>
                    {item.nombre} x{item.cantidad || 1} — ${(item.precio * (item.cantidad || 1)).toLocaleString()}
                  </li>
                ))}
              </ul>
              <div className="totales-caja">
                <div>Subtotal: ${pedidoSeleccionado.subtotal?.toLocaleString()}</div>
                <div>IVA: ${pedidoSeleccionado.iva?.toLocaleString()}</div>
                <div><strong>Total: ${pedidoSeleccionado.total?.toLocaleString()}</strong></div>
              </div>
              <button
                className="btn-pagar"
                onClick={procesarPago}
                disabled={pagando}
              >
                {pagando ? 'Procesando...' : '✅ Cobrar y Liberar Mesa'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Caja;
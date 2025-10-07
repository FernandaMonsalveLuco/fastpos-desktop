// src/renderer/components/Caja.js
import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import TipoPago from './TipoPago';
import Ticket from './Ticket';
import TicketPDF from './TicketPDF';

const Caja = ({ user, carrito, onBack, onVaciarCarrito }) => {
  const [loading, setLoading] = useState(false);
  const [showTipoPago, setShowTipoPago] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const ticketRef = useRef(null); 

  const items = carrito;
  const total = items.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  const generarPDF = async (venta) => {
  const ticketId = 'ticket-pdf-' + Date.now();
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  document.body.appendChild(tempContainer);

  const root = tempContainer.attachShadow ? tempContainer.attachShadow({ mode: 'open' }) : tempContainer;
  const ticketElement = document.createElement('div');
  ticketElement.id = ticketId;
  root.appendChild(ticketElement);
  
  ticketElement.innerHTML = `
  <div style="font-family: 'Courier New', monospace; font-size: 14px; width: 300px; padding: 10px; background: white;">
    <div style="text-align: center; margin-bottom: 10px;">
      <h2 style="margin: 0; font-size: 18px;">${venta.cajeroNombre || 'FastPOS'}</h2>
      <p>${new Date().toLocaleString('es-ES')}</p>
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    ${venta.productos.map(p => `
      <div style="display: flex; justify-content: space-between;">
        <span>${p.cantidad}x ${p.nombre}</span>
        <span>$${p.subtotal.toLocaleString()}</span>
      </div>
    `).join('')}
      <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
          <div style="font-weight: bold; text-align: right; margin-top: 8px;">
            TOTAL: $${venta.total.toLocaleString()}
          </div>
          ${venta.vuelto != null ? `
            <div style="font-weight: bold; text-align: right;">
              VUELTO: $${venta.vuelto.toLocaleString()}
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 15px; font-size: 12px;">
            <p>¡Gracias por tu compra!</p>
            <p>www.fastpos.cl</p>
          </div>
        </div>
      `;

      try {
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150], 
      });

      const imgWidth = 80; 
      const pageHeight = 150;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ticket-${venta.cajeroNombre}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('No se pudo generar el PDF del ticket.');
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  const imprimirTicket = (venta) => {
    try {
      const ticketHTML = renderToString(<Ticket venta={venta} />);

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        alert('Por favor permite ventanas emergentes para imprimir.');
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        ${ticketHTML}
      `);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        };
      } catch (err) {
        console.error('Error al imprimir el ticket:', err);
        alert('No se pudo imprimir el ticket. Revisa la consola.');
      }
    };
  const handleConfirmarPago = async (datosPago) => {
    if (items.length === 0) {
      setMensaje('No hay productos para registrar.');
      return;
    }

    setLoading(true);
    setMensaje('');

  try {
    const venta = {
      fecha: new serverTimestamp(), 
      cajeroId: user.uid,
      cajeroNombre: user.name || user.email?.split('@')[0] || 'Desconocido',
      productos: items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad || 1,
        subtotal: item.precio * (item.cantidad || 1),
      })),
      total: total,
        metodoPago: datosPago.metodo,
        montoRecibido: datosPago.montoRecibido,
        vuelto: datosPago.vuelto,
        estado: 'completada',
        tipo: 'pizzeria',
      };

      const docRef = await addDoc(collection(db, 'ventas'), venta);

      imprimirTicket(venta);
      
      await generarPDF(venta);

      setMensaje(`Venta registrada con éxito. ID: ${docRef.id}`);
      onVaciarCarrito();
      setShowTipoPago(false);

      setTimeout(() => onBack(), 2000);
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
          margin: '20px auto',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(90, 90, 90, 0.45)',
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
                  Subtotal: ${(item.precio * (item.cantidad || 1)).toLocaleString()}
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
          {showTipoPago ? (
            <TipoPago
              total={total}
              onPagar={handleConfirmarPago}
              onCancel={() => setShowTipoPago(false)}
            />
          ) : (
            <>
              <button
                className="btn-pagar"
                onClick={() => setShowTipoPago(true)}
                disabled={loading || items.length === 0}
                style={{ width: '100%', marginBottom: '12px' }}
              >
                {loading ? 'Procesando...' : 'Pagar Pedido'}
              </button>
              <button className="btn-volver" onClick={onBack}>
                Volver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Caja;
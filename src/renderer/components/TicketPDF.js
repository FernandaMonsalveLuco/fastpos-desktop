// src/renderer/components/TicketPDF.js
import React from 'react';

const TicketPDF = ({ venta, id }) => {
  const fecha = new Date().toLocaleString('es-ES');

  return (
    <div
      id={id}
      style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        width: '300px',
        padding: '10px',
        margin: '0 auto',
        backgroundColor: 'white',
        lineHeight: 1.4,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0', fontSize: '18px' }}>
                {venta.cajeroNombre || 'FastPOS'}
            </h2>
            <p>{fecha}</p>
        </div>
        <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
            {venta.productos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.cantidad}x {p.nombre}</span>
                    <span>${p.subtotal.toLocaleString()}</span>
                </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
        <div style={{ fontWeight: 'bold', textAlign: 'right', marginTop: '8px' }}> TOTAL: ${venta.total.toLocaleString()}
        </div>
        {venta.vuelto != null && (
            <div style={{ fontWeight: 'bold', textAlign: 'right' }}>
                VUELTO: ${venta.vuelto.toLocaleString()}
                </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px' }}>
                <p>¡Gracias por tu compra!</p>
                <p>www.fastpos.cl</p>
                </div>
                </div>);};

export default TicketPDF;
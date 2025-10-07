// src/renderer/components/Ticket.js
import React from 'react';

const Ticket = ({ venta }) => {
  const fecha = new Date().toLocaleString('es-ES');

  return (
  <html>
    <head>
        <meta charSet="UTF-8" />
        <title>Ticket - FastPOS</title>
        <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 10px; width: 300px;}
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { margin: 0; font-size: 18px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-weight: bold; margin-top: 8px; text-align: right; }
        .footer { text-align: center; margin-top: 15px; font-size: 12px;}` }} />
    </head>
    <body>
        <div className="header">
            <h2>{venta.cajeroNombre || 'FastPOS'}</h2>
            <p>{fecha}</p>
        </div>
        
        <div className="divider"></div>
        <table>
            <tbody>
                {venta.productos.map((p, i) => (
                    <tr key={i}>
                        <td>{p.cantidad}x {p.nombre}</td>
                        <td style={{ textAlign: 'right' }}>${p.subtotal.toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        <div className="divider"></div>
        <div className="total">TOTAL: ${venta.total.toLocaleString()}</div>
        {venta.vuelto != null && (
            <div className="total">VUELTO: ${venta.vuelto.toLocaleString()}</div>
            )}
            <div className="footer">
                <p>¡Gracias por tu compra!</p>
                <p>www.fastpos.cl</p>
                </div>
                </body>
                </html>
                );};

export default Ticket;
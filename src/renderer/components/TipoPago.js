// src/renderer/components/TipoPago.js
import React, { useState } from 'react';

const TipoPago = ({ total, onPagar, onCancel }) => {
  const [metodo, setMetodo] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');

  const handlePagar = (e) => {
    e.preventDefault();
    
    if (metodo === 'efectivo') {
        const recibido = parseFloat(montoRecibido);
        if (isNaN(recibido) || recibido < total) {
            alert(`El monto recibido debe ser al menos $${total}`);
            return;
        }
        onPagar({
            metodo,
            montoRecibido: recibido,
            vuelto: recibido - total
        });
        } else {
            onPagar({ metodo, montoRecibido: total, vuelto: 0 });
        }
    };

    return (
    <div className="tipo-pago-modal">
        <div className="tipo-pago-contenido">
        <h3>Seleccionar Método de Pago</h3>
        <p className="total-pagar">Total a pagar: <strong>${total.toLocaleString()}</strong></p>

        <form onSubmit={handlePagar}>
            <div className="form-group">
                <label>
                    <input
                    type="radio"
                    name="metodo"
                    value="efectivo"
                    checked={metodo === 'efectivo'}
                    onChange={(e) => setMetodo(e.target.value)}/>
                    Efectivo
                </label>
            </div>

            <div className="form-group">
                <label>
                    <input
                    type="radio"
                    name="metodo"
                    value="tarjeta"
                    checked={metodo === 'tarjeta'}
                    onChange={(e) => setMetodo(e.target.value)}/>
                    Tarjeta (Débito/Crédito)
                </label>
            </div>

            <div className="form-group">
                <label>
                    <input
                    type="radio"
                    name="metodo"
                    value="transferencia"
                    checked={metodo === 'transferencia'}
                    onChange={(e) => setMetodo(e.target.value)}/>
                    Transferencia Bancaria
                </label>
            </div>

            {metodo === 'efectivo' && (
                <div className="form-group efectivo-input">
                    <label htmlFor="montoRecibido"> Monto recibido ($) </label>
                        <input
                        id="montoRecibido"
                        type="number"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        min={total}
                        step="100"
                        required/>
                </div>
            )}

            <div className="form-buttons">
                <button type="submit" className="btn-pagar">
                    Confirmar Pago
                </button>
                <button type="button" className="btn-cancelar" onClick={onCancel}>
                    Cancelar
                </button>
            </div>
        </form>
    </div>
</div>
);};

export default TipoPago;
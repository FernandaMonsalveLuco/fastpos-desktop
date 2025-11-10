// src/renderer/components/PedidoActivo.js
import React, { useMemo } from 'react';

const PedidoActivo = ({ mesaNumero, items = [], ivaPorcentaje = 19, onEliminarItem }) => {
  const subtotal = useMemo(() =>
    items.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0),
    [items]
  );
  const iva = useMemo(() =>
    Math.round(subtotal * (ivaPorcentaje / 100)),
    [subtotal, ivaPorcentaje]
  );
  const total = subtotal + iva;

  return (
    <div className="pedido-activo-panel">
      <div className="pedido-header">
        <h3>Pedido - Mesa {mesaNumero}</h3>
      </div>

      <div className="pedido-items">
        {items.length === 0 ? (
          <p className="pedido-vacio">No hay productos en la orden.</p>
        ) : (
          <ul className="lista-items">
            {items.map((item) => (
              <li key={item.id} className="item-pedido">
                <span className="item-nombre">
                  {item.nombre} ×{item.cantidad || 1}
                </span>
                <div className="item-detalles">
                  <span className="item-precio">
                    ${(item.precio * (item.cantidad || 1)).toLocaleString()}
                  </span>
                  <button
                    className="btn-eliminar-item"
                    onClick={() => onEliminarItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pedido-totales">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="total-row">
          <span>IVA ({ivaPorcentaje}%)</span>
          <span>${iva.toLocaleString()}</span>
        </div>
        <div className="total-row total-final">
          <span>Total:</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PedidoActivo;
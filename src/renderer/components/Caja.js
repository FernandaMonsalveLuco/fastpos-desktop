// src/renderer/components/Caja.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import TipoPago from './TipoPago';
import Ticket from './Ticket';
import { renderToString } from 'react-dom/server';

const Caja = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [mesasOcupadas, setMesasOcupadas] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [showTipoPago, setShowTipoPago] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const IVA_TASA = 0.19;

  // Cargar mesas ocupadas
  useEffect(() => {
    cargarMesasOcupadas();
  }, []);

  const cargarMesasOcupadas = async () => {
    try {
      const mesasSnapshot = await getDocs(collection(db, 'mesas'));
      const mesas = mesasSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(mesa => mesa.estado === 'ocupada' && mesa.activo);
      setMesasOcupadas(mesas);
    } catch (error) {
      console.error('Error al cargar mesas ocupadas:', error);
    }
  };

  // Cargar pedidos de una mesa específica
  const cargarPedidosMesa = async (mesaId) => {
    try {
      const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
      const pedidos = pedidosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(pedido => 
          pedido.mesaId === mesaId && 
          (pedido.estado === 'En cocina' || pedido.estado === 'Listo')
        );
      
      if (pedidos.length > 0) {
        setPedidoSeleccionado(pedidos[0]); // Tomar el primer pedido activo
      } else {
        setPedidoSeleccionado(null);
        setMensaje('No hay pedidos activos para esta mesa');
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
  };

  // Manejar selección de mesa
  const handleSeleccionarMesa = async (mesa) => {
    setMesaSeleccionada(mesa);
    await cargarPedidosMesa(mesa.id);
  };

  // Cálculos fiscales
  const items = pedidoSeleccionado?.productos || [];
  const totalBruto = items.reduce((sum, item) => sum + (item.subtotal || item.precio * (item.cantidad || 1)), 0);
  const baseImponible = totalBruto / (1 + IVA_TASA);
  const iva = totalBruto - baseImponible;
  const montoDescuento = totalBruto * descuentoAplicado;
  const totalNeto = totalBruto - montoDescuento;

  const codigosValidos = {
    ABC123: 0.10,
    ABC456: 0.20,
    ABC789: 0.30,
  };

  const aplicarDescuento = () => {
    const codigo = codigoDescuento.trim().toUpperCase();
    if (codigosValidos.hasOwnProperty(codigo)) {
      setDescuentoAplicado(codigosValidos[codigo]);
      setMensaje('Descuento aplicado correctamente.');
    } else {
      setMensaje('Código de descuento inválido.');
      setDescuentoAplicado(0);
    }
  };

  const limpiarDescuento = () => {
    setCodigoDescuento('');
    setDescuentoAplicado(0);
    setMensaje('');
  };

  const handleConfirmarPago = async (datosPago) => {
    if (!pedidoSeleccionado) {
      setMensaje('No hay pedido seleccionado.');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      // Registrar venta
      const venta = {
        fecha: serverTimestamp(),
        cajeroId: user.uid,
        cajeroNombre: user.name || user.email?.split('@')[0] || 'Desconocido',
        mesaId: mesaSeleccionada.id,
        mesaNumero: mesaSeleccionada.numero,
        productos: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad || 1,
          subtotal: item.subtotal || item.precio * (item.cantidad || 1),
        })),
        baseImponible: Math.round(baseImponible),
        iva: Math.round(iva),
        totalBruto: Math.round(totalBruto),
        descuentoMonto: Math.round(montoDescuento),
        descuentoPorcentaje: descuentoAplicado > 0 ? Math.round(descuentoAplicado * 100) : 0,
        total: Math.round(totalNeto),
        metodoPago: datosPago.metodo,
        montoRecibido: datosPago.montoRecibido,
        vuelto: datosPago.vuelto,
        estado: 'completada',
        tipo: 'pizzeria',
      };

      const docRef = await addDoc(collection(db, 'ventas'), venta);

      // Actualizar estado del pedido
      await updateDoc(doc(db, 'pedidos', pedidoSeleccionado.id), {
        estado: 'Pagado',
        fechaPago: serverTimestamp()
      });

      // Liberar mesa
      await updateDoc(doc(db, 'mesas', mesaSeleccionada.id), {
        estado: 'libre'
      });

      // Imprimir ticket
      const ticketHTML = renderToString(<Ticket venta={venta} />);
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html>${ticketHTML}`);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }

      setMensaje(`Venta registrada con éxito. ID: ${docRef.id}`);
      // Resetear selección
      setMesaSeleccionada(null);
      setPedidoSeleccionado(null);
      limpiarDescuento();
      setTimeout(() => {
        cargarMesasOcupadas();
        setShowTipoPago(false);
      }, 2000);
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      setMensaje(`Error: ${error.message || 'No se pudo registrar la venta.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!mesaSeleccionada) {
    return (
      <div className="dashboard-container">
        <div className="caja-header">
          <button className="btn-volver" onClick={onBack}>
            ← Volver
          </button>
          <h2>Caja - Seleccionar Mesa</h2>
        </div>
        
        {mensaje && (
          <p className={mensaje.includes('éxito') ? 'success' : 'error'}>
            {mensaje}
          </p>
        )}

        <div className="mesas-ocupadas">
          <h3>Mesas Ocupadas</h3>
          {mesasOcupadas.length === 0 ? (
            <p>No hay mesas ocupadas</p>
          ) : (
            <div className="grid-mesas">
              {mesasOcupadas.map(mesa => (
                <button
                  key={mesa.id}
                  className="btn-mesa-ocupada"
                  onClick={() => handleSeleccionarMesa(mesa)}
                >
                  Mesa {mesa.numero}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="caja-header">
        <button className="btn-volver" onClick={() => setMesaSeleccionada(null)}>
          ← Cambiar Mesa
        </button>
        <h2>Caja - Mesa {mesaSeleccionada.numero}</h2>
      </div>

      {mensaje && (
        <p className={mensaje.includes('éxito') ? 'success' : 'error'}>
          {mensaje}
        </p>
      )}

      <div className="pedido-detalles">
        <h3>Detalles del Pedido</h3>
        {items.length === 0 ? (
          <p>No hay productos en el pedido.</p>
        ) : (
          <div className="pedido-items">
            {items.map((item) => (
              <div key={item.id} className="pedido-item">
                <div className="item-info">
                  <strong>{item.nombre}</strong>
                  <span>{item.cantidad || 1} x ${item.precio?.toLocaleString()}</span>
                </div>
                <div className="item-subtotal">
                  Subtotal: ${(item.subtotal || item.precio * (item.cantidad || 1)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN DE DESCUENTO */}
      <div className="seccion-descuento">
        <h3>Aplicar descuento</h3>
        <div className="descuento-input">
          <input
            type="text"
            value={codigoDescuento}
            onChange={(e) => setCodigoDescuento(e.target.value)}
            placeholder="Ingresa tu código (ej. ABC123)"
          />
          <button
            onClick={aplicarDescuento}
            disabled={!codigoDescuento.trim()}
          >
            Aplicar
          </button>
        </div>
        {descuentoAplicado > 0 && (
          <div className="descuento-aplicado">
            ✔ Descuento del {Math.round(descuentoAplicado * 100)}% aplicado
          </div>
        )}
      </div>

      {/* DESGLOSE FISCAL */}
      <div className="totales">
        <div className="total-linea">
          <span>Base imponible:</span>
          <span>${Math.round(baseImponible).toLocaleString()}</span>
        </div>
        <div className="total-linea">
          <span>IVA (19%):</span>
          <span>${Math.round(iva).toLocaleString()}</span>
        </div>
        <div className="total-linea total-bruto">
          <span>Total bruto:</span>
          <span>${Math.round(totalBruto).toLocaleString()}</span>
        </div>

        {descuentoAplicado > 0 && (
          <>
            <div className="total-linea descuento-linea">
              <span>Descuento ({Math.round(descuentoAplicado * 100)}%):</span>
              <span>-${Math.round(montoDescuento).toLocaleString()}</span>
            </div>
            <div className="total-linea separador"></div>
            <div className="total-linea total-neto">
              <span>Total neto:</span>
              <span>${Math.round(totalNeto).toLocaleString()}</span>
            </div>
          </>
        )}

        {!descuentoAplicado && (
          <div className="total-linea total-pagar">
            <span>Total a pagar:</span>
            <span>${Math.round(totalBruto).toLocaleString()}</span>
          </div>
        )}

        <div className="botones-pago">
          {showTipoPago ? (
            <TipoPago
              total={Math.round(totalNeto)}
              onPagar={handleConfirmarPago}
              onCancel={() => setShowTipoPago(false)}
            />
          ) : (
            <>
              <button
                className="btn-pagar"
                onClick={() => setShowTipoPago(true)}
                disabled={loading || items.length === 0}
              >
                {loading ? 'Procesando...' : 'Pagar Pedido'}
              </button>
              <button className="btn-volver" onClick={() => setMesaSeleccionada(null)}>
                Cambiar Mesa
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Caja;
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

// src/renderer/components/Caja.js
import React, { useState, useRef, useEffect } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import TipoPago from './TipoPago';
import Ticket from './Ticket';
import { renderToString } from 'react-dom/server';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Caja = ({ user, carrito, onBack, onVaciarCarrito }) => {
  const [loading, setLoading] = useState(false);
  const [showTipoPago, setShowTipoPago] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [productosConInsumos, setProductosConInsumos] = useState([]); // Para cargar insumos

  const IVA_TASA = 0.19;

  // Cargar productos con insumos desde Firestore
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'Productos'));
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          insumos: doc.data().insumos || [],
        }));
        setProductosConInsumos(lista);
      } catch (err) {
        console.error('Error al cargar productos con insumos:', err);
      }
    };
    cargarProductos();
  }, []);

  const items = carrito;
  const totalBruto = items.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
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

  // ✅ Función para actualizar inventario
  const actualizarInventario = async (itemsVendidos) => {
    // Mapear consumo total por insumo
    const consumoInsumos = {};

    for (const item of itemsVendidos) {
      const producto = productosConInsumos.find(p => p.id === item.id);
      if (!producto || !producto.insumos?.length) continue;

      const cantidadVendida = item.cantidad || 1;
      for (const insumo of producto.insumos) {
        const clave = insumo.nombre.toLowerCase().replace(/\s+/g, '-');
        const cantidadNecesaria = insumo.cantidad * cantidadVendida;

        consumoInsumos[clave] = (consumoInsumos[clave] || 0) + cantidadNecesaria;
      }
    }

    // Actualizar cada insumo en Firestore
    for (const [clave, cantidadUsada] of Object.entries(consumoInsumos)) {
      const insumoRef = doc(db, 'inventario', clave);
      const insumoSnap = await getDoc(insumoRef);

      if (insumoSnap.exists()) {
      const nuevaCantidad = insumoSnap.data().cantidad - cantidadUsada;
      if (nuevaCantidad < 0) {
        throw new Error(`Stock insuficiente para: ${clave}`);
      }
      await updateDoc(insumoRef, { cantidad: nuevaCantidad });
      } else {
        // ✅ Crear el insumo con stock inicial 0 (o un valor por defecto)
        console.warn(`Insumo no encontrado. Creando: ${clave}`);
        await setDoc(insumoRef, {
          nombre: clave.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          cantidad: -cantidadUsada, // o 0 si no quieres permitir venta sin stock
        });
    }}
  };

  // ✅ Funciones de impresión (definidas antes de handleConfirmarPago)
  const imprimirTicket = (venta) => {
    try {
      const ticketHTML = renderToString(<Ticket venta={venta} />);
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        alert('Permite ventanas emergentes para imprimir.');
        return;
      }
      printWindow.document.write(`<!DOCTYPE html>${ticketHTML}`);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (err) {
      console.error('Error al imprimir ticket:', err);
      alert('No se pudo imprimir el ticket.');
    }
  };

  const generarPDF = async (venta) => {
    // Tu lógica existente de PDF (asegúrate de tener html2canvas y jspdf instalados)
    // Si no la usas, puedes omitirla o dejar un placeholder
    console.log('Generando PDF (implementación omitida por brevedad)');
  };

  // ✅ Manejador de pago
  const handleConfirmarPago = async (datosPago) => {
    if (items.length === 0) {
      setMensaje('No hay productos para registrar.');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      // 1. Registrar venta
      const venta = {
        fecha: serverTimestamp(),
        cajeroId: user.uid,
        cajeroNombre: user.name || user.email?.split('@')[0] || 'Desconocido',
        productos: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad || 1,
          subtotal: item.precio * (item.cantidad || 1),
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

      // 2. Actualizar inventario
      await actualizarInventario(items);

      // 3. Imprimir
      imprimirTicket(venta);
      await generarPDF(venta);

      setMensaje(`Venta registrada con éxito. ID: ${docRef.id}`);
      onVaciarCarrito();
      setShowTipoPago(false);
      limpiarDescuento();
      setTimeout(() => onBack(), 2000);
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      setMensaje(`Error: ${error.message || 'No se pudo registrar la venta.'}`);
    } finally {
      setLoading(false);
    }
  };

  // ... (resto del JSX igual, solo cambia el cálculo de totales si usas productosConInsumos, pero no es necesario)

  return (
    <div className="caja-container">
      {/* ... (todo el JSX anterior SIN cambios) ... */}
      {/* El resto del return() se mantiene exactamente igual */}
      {mensaje && (
        <p
          className={mensaje.includes('éxito') || mensaje.includes('correctamente') ? 'success' : 'error'}
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

      {/* SECCIÓN DE DESCUENTO */}
      <div
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
        <h3 style={{ marginBottom: '12px', textAlign: 'center' }}>Aplicar descuento</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={codigoDescuento}
            onChange={(e) => setCodigoDescuento(e.target.value)}
            placeholder="Ingresa tu código (ej. ABC123)"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={aplicarDescuento}
            disabled={!codigoDescuento.trim()}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Aplicar
          </button>
        </div>
        {descuentoAplicado > 0 && (
          <div style={{ textAlign: 'center', color: '#2E7D32', fontWeight: 'bold' }}>
            ✔ Descuento del {Math.round(descuentoAplicado * 100)}% aplicado
          </div>
        )}
      </div>

      {/* DESGLOSE FISCAL */}
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
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Base imponible:</span>
          <span>${Math.round(baseImponible).toLocaleString()}</span>
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>IVA (19%):</span>
          <span>${Math.round(iva).toLocaleString()}</span>
        </div>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Total bruto:</span>
          <span>${Math.round(totalBruto).toLocaleString()}</span>
        </div>

        {descuentoAplicado > 0 && (
          <>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}>
              <span>Descuento ({Math.round(descuentoAplicado * 100)}%):</span>
              <span>-${Math.round(montoDescuento).toLocaleString()}</span>
            </div>
            <div style={{ borderTop: '1px dashed #aaa', paddingTop: '8px' }}></div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 'bold',
                marginTop: '8px',
              }}
            >
              <span>Total neto:</span>
              <span>${Math.round(totalNeto).toLocaleString()}</span>
            </div>
          </>
        )}

        {!descuentoAplicado && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold',
              marginTop: '8px',
            }}
          >
            <span>Total a pagar:</span>
            <span>${Math.round(totalBruto).toLocaleString()}</span>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
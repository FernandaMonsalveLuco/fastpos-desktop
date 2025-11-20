import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportesAdmin = ({ onBack }) => {
  const [ventas, setVentas] = useState([]);
  const [topProductos, setTopProductos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'ventas'));

      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate ? doc.data().fecha.toDate() : null
      }));

      // ORDENAR POR FECHA (más reciente primero)
      data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setVentas(data);

      // ===========================================
      // CALCULAR PRODUCTOS MÁS VENDIDOS
      // ===========================================
      const productosVendidos = {};

      data.forEach(v => {
        if (Array.isArray(v.productos)) {
          v.productos.forEach(p => {
            const nombre = p.nombre || "Producto";
            const cantidad = p.cantidad || 1;

            if (!productosVendidos[nombre]) {
              productosVendidos[nombre] = 0;
            }

            productosVendidos[nombre] += cantidad;
          });
        }
      });

      const top = Object.entries(productosVendidos)
        .map(([nombre, vendidos]) => ({ nombre, vendidos }))
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, 10);

      setTopProductos(top);
    };

    fetchData();
  }, []);

  // EXPORTAR PDF
  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Reporte de Ventas", 14, 20);

    const tabla = ventas.map(v => [
      v.fecha?.toLocaleDateString() || '',
      `$${v.total?.toLocaleString() || 0}`,
      v.metodoPago || ''
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Total', 'Método de Pago']],
      body: tabla,
    });

    // === SEGUNDA TABLA: TOP PRODUCTOS ===
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Productos Más Vendidos", 14, 20);

    const tablaProd = topProductos.map(p => [
      p.nombre,
      p.vendidos
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Producto', 'Cantidad Vendida']],
      body: tablaProd,
    });

    doc.save("reporte_completo.pdf");
  };

  return (
    <div className="dashboard-container" style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Reportes Administrativos</h2>
      <button
        onClick={onBack}
        className="btn-volver"
        style={{ marginBottom: 20 }}
      >
        Volver
      </button>

      /* Botone exportar
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        <button className="btn-editar" onClick={exportarPDF}>
          Exportar PDF
        </button>
      </div>

      {/* TABLA DE VENTAS */}
      <h3 style={{ marginBottom: 10 }}>Ventas Registradas</h3>

      <table className="usuarios-table" style={{ marginBottom: 40 }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Total</th>
            <th>Método de Pago</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(v => (
            <tr key={v.id}>
              <td>{v.fecha?.toLocaleDateString() || ''}</td>
              <td>${v.total?.toLocaleString() || 0}</td>
              <td>{v.metodoPago || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOP PRODUCTOS */}
      <h3 style={{ marginBottom: 10 }}>Productos Más Vendidos</h3>

      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Vendidos</th>
          </tr>
        </thead>
        <tbody>
          {topProductos.map((p, i) => (
            <tr key={i}>
              <td>{p.nombre}</td>
              <td>{p.vendidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportesAdmin;

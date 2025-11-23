// src/renderer/components/ReportesAdmin.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportesAdmin = ({ onBack }) => {
  const [ventas, setVentas] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [totalVentasMes, setTotalVentasMes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Obtener el rango de fechas del mes actual
  const getMesActualRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  useEffect(() => {
    const cargarVentasDelMes = async () => {
      setLoading(true);
      const { start, end } = getMesActualRange();

      try {
        // Filtrar ventas del mes actual usando Firestore
        const q = query(
          collection(db, 'ventas'),
          where('fecha', '>=', start),
          where('fecha', '<=', end)
        );

        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            fecha: docData.fecha?.toDate ? docData.fecha.toDate() : null
          };
        }).filter(v => v.fecha); // Solo ventas con fecha válida

        // Ordenar por fecha descendente
        data.sort((a, b) => b.fecha - a.fecha);

        // Calcular total del mes
        const total = data.reduce((sum, v) => sum + (v.total || 0), 0);
        setTotalVentasMes(total);

        // Calcular productos más vendidos
        const productosVendidos = {};
        data.forEach(v => {
          if (Array.isArray(v.productos)) {
            v.productos.forEach(p => {
              const nombre = p.nombre || 'Producto';
              const cantidad = p.cantidad || 1;
              productosVendidos[nombre] = (productosVendidos[nombre] || 0) + cantidad;
            });
          }
        });

        const top = Object.entries(productosVendidos)
          .map(([nombre, vendidos]) => ({ nombre, vendidos }))
          .sort((a, b) => b.vendidos - a.vendidos)
          .slice(0, 10);

        setVentas(data);
        setTopProductos(top);
      } catch (error) {
        console.error('Error al cargar reportes:', error);
        alert('Error al cargar los reportes');
      } finally {
        setLoading(false);
      }
    };

    cargarVentasDelMes();
  }, []);

  // === EXPORTAR PDF ===
  const exportarPDF = () => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text("Reporte Mensual de Ventas", 14, 20);

    // Total del mes
    doc.setFontSize(14);
    doc.text(`Total Ventas: $${totalVentasMes.toLocaleString()}`, 14, 30);

    // Tabla de ventas
    const tablaVentas = ventas.map(v => [
      v.fecha.toLocaleDateString('es-ES'),
      `$${(v.total || 0).toLocaleString()}`,
      v.metodoPago || 'N/A'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Total', 'Método de Pago']],
      body: tablaVentas,
      theme: 'grid',
      headStyles: { fillColor: [2, 120, 217] } // --primary-medium
    });

    // Segunda página: Productos más vendidos
    doc.addPage();
    doc.setFontSize(20);
    doc.text("Productos Más Vendidos (Mes Actual)", 14, 20);

    const tablaProductos = topProductos.map(p => [p.nombre, p.vendidos]);

    autoTable(doc, {
      startY: 30,
      head: [['Producto', 'Cantidad Vendida']],
      body: tablaProductos,
      theme: 'grid',
      headStyles: { fillColor: [2, 120, 217] }
    });

    doc.save(`reporte_ventas_${new Date().toISOString().slice(0, 7)}.pdf`);
  };

  // === EXPORTAR EXCEL ===
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Ventas
    const ventasData = ventas.map(v => ({
      Fecha: v.fecha.toLocaleDateString('es-ES'),
      Total: v.total || 0,
      'Método de Pago': v.metodoPago || 'N/A'
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasData);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

    // Hoja 2: Productos más vendidos
    const productosData = topProductos.map(p => ({
      Producto: p.nombre,
      'Cantidad Vendida': p.vendidos
    }));
    const wsProductos = XLSX.utils.json_to_sheet(productosData);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos Más Vendidos');

    // Guardar
    XLSX.writeFile(wb, `reporte_ventas_${new Date().toISOString().slice(0, 7)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ padding: 20 }}>
        <h2>Cargando reportes...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: 20 }}>
      <h2>Reportes Administrativos</h2>
      <button onClick={onBack} className="btn-volver" style={{ marginBottom: 20 }}>
        Volver
      </button>

      {/* Métrica destacada */}
      <div className="metric-card3" style={{ padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <div className="metric-label">Total Ventas del Mes</div>
        <div className="metric-value">${totalVentasMes.toLocaleString()}</div>
      </div>

      {/* Botones de exportación */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        <button className="btn-editar" onClick={exportarPDF}>
          Exportar PDF
        </button>
        <button className="btn-agregar" onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      {/* TABLA DE VENTAS */}
      <h3>Ventas Registradas (Mes Actual)</h3>
      {ventas.length === 0 ? (
        <p>No hay ventas registradas este mes.</p>
      ) : (
        <table className="usuarios-table" style={{ marginBottom: 40, width: '100%' }}>
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
                <td>{v.fecha?.toLocaleDateString('es-ES') || ''}</td>
                <td>${(v.total || 0).toLocaleString()}</td>
                <td>{v.metodoPago || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* TOP PRODUCTOS */}
      <h3>Productos Más Vendidos (Mes Actual)</h3>
      {topProductos.length === 0 ? (
        <p>No hay productos vendidos este mes.</p>
      ) : (
        <table className="usuarios-table" style={{ width: '100%' }}>
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
      )}
    </div>
  );
};

export default ReportesAdmin;
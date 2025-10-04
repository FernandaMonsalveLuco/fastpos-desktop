// src/renderer/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
<<<<<<< HEAD
  ArcElement,
=======
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
} from 'chart.js';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
<<<<<<< HEAD
  Filler,
  ArcElement
);

import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { color } from 'chart.js/helpers';

const Dashboard = ({ user, onLogout, onSectionChange }) => {
=======
  Filler
);

import { Bar, Line } from 'react-chartjs-2';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = ({ user, onLogout, onSectionChange }) => {
  // Estado inicial con valores por defecto visibles
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
  const [metrics, setMetrics] = useState({
    ventasHoy: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    pedidosPendientes: 0,
    topProductos: [],
    ventas7Dias: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      data: [0, 0, 0, 0, 0, 0, 0]
<<<<<<< HEAD
    },
    ventasPorCajero: []
=======
    }
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
  });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { id: 'tomarPedido', label: 'Tomar Pedido' },
    { id: 'caja', label: 'Caja' },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'productos', label: 'Productos' },
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'configuracion', label: 'Configuración' },
  ];

  useEffect(() => {
<<<<<<< HEAD
    const fetchMetricsFromData = async () => {
      try {
        const ventasSnapshot = await getDocs(collection(db, 'ventas'));
        const ventas = ventasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fecha: doc.data().fecha?.toDate ? doc.data().fecha.toDate() : new Date()
        }));

        const usuariosSnapshot = await getDocs(collection(db, 'Usuarios'));
        const usuariosMap = {};
        usuariosSnapshot.docs.forEach(doc => {
          const data = doc.data();
          usuariosMap[doc.id] = data.name || data.email?.split('@')[0] || 'Usuario';
        });

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let ventasHoy = 0;
        let pedidosHoy = 0;
        let pedidosPendientes = 0;
        let totalVentas = 0;
        let totalPedidos = 0;
        const productosVendidos = {};
        const cajerosVentas = {};
        const ventasPorDia = Array(7).fill(0);

        ventas.forEach(venta => {
          const cajeroId = venta.cajeroId;
          const cajeroNombre = usuariosMap[cajeroId] || 'Desconocido';
          const totalVenta = venta.total || 0;

          if (!cajerosVentas[cajeroId]) {
            cajerosVentas[cajeroId] = {
              nombre: cajeroNombre,
              total: 0,
              pedidos: 0
            };
          }

          if (venta.estado === 'pendiente') {
            pedidosPendientes++;
          }

          cajerosVentas[cajeroId].total += totalVenta;
          cajerosVentas[cajeroId].pedidos += 1;

          totalVentas += totalVenta;
          totalPedidos++;

          const fechaVenta = venta.fecha;
          const fechaSinHora = new Date(fechaVenta);
          fechaSinHora.setHours(0, 0, 0, 0);

          if (fechaSinHora.getTime() === hoy.getTime()) {
            ventasHoy += totalVenta;
            pedidosHoy++;
          }

          if (Array.isArray(venta.productos)) {
            venta.productos.forEach(p => {
              const nombre = p.nombre || 'Producto';
              if (!productosVendidos[nombre]) {
                productosVendidos[nombre] = 0;
              }
              productosVendidos[nombre] += p.cantidad || 1;
            });
          }

          const diffTime = hoy - fechaSinHora;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            const diaIndex = fechaSinHora.getDay() === 0 ? 6 : fechaSinHora.getDay() - 1;
            ventasPorDia[diaIndex] += totalVenta;
          }
        });

        const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
        const topProductos = Object.entries(productosVendidos)
          .map(([nombre, vendidos]) => ({ nombre, vendidos }))
          .sort((a, b) => b.vendidos - a.vendidos)
          .slice(0, 5);

        const ventasPorCajero = Object.values(cajerosVentas).map(cajero => ({
          nombre: cajero.nombre,
          total: cajero.total,
          pedidos: cajero.pedidos,
          ticketPromedio: cajero.pedidos > 0 ? cajero.total / cajero.pedidos : 0
        }));

        setMetrics({
          ventasHoy,
          pedidosHoy,
          ticketPromedio,
          pedidosPendientes,
          topProductos,
          ventas7Dias: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            data: ventasPorDia
          },
          ventasPorCajero
        });
      } catch (error) {
        console.error('Error al calcular métricas:', error);
=======
    const fetchMetrics = async () => {
      try {
        const metricsDoc = await getDoc(doc(db, 'metrics', 'resumen'));
        if (metricsDoc.exists()) {
          const data = metricsDoc.data();
          setMetrics({
            ventasHoy: typeof data.ventasHoy === 'number' ? data.ventasHoy : 0,
            pedidosHoy: typeof data.pedidosHoy === 'number' ? data.pedidosHoy : 0,
            ticketPromedio: typeof data.ticketPromedio === 'number' ? data.ticketPromedio : 0,
            pedidosPendientes: typeof data.pedidosPendientes === 'number' ? data.pedidosPendientes : 0,
            topProductos: Array.isArray(data.topProductos) ? data.topProductos : [],
            ventas7Dias: {
              labels: Array.isArray(data.ventas7Dias?.labels) && data.ventas7Dias.labels.length === 7
                ? data.ventas7Dias.labels
                : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
              data: Array.isArray(data.ventas7Dias?.data) && data.ventas7Dias.data.length === 7
                ? data.ventas7Dias.data.map(v => (typeof v === 'number' ? v : 0))
                : [0, 0, 0, 0, 0, 0, 0]
            }
          });
        } else {
          // Documento no existe → usar valores por defecto
          setMetrics({
            ventasHoy: 0,
            pedidosHoy: 0,
            ticketPromedio: 0,
            pedidosPendientes: 0,
            topProductos: [],
            ventas7Dias: {
              labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
               data: [0, 0, 0, 0, 0, 0, 0]
            }
          });
        }
      } catch (error) {
        console.error('Error al cargar métricas:', error);
        // En caso de error (ej. permisos), mostrar valores por defecto
        setMetrics({
          ventasHoy: 0,
          pedidosHoy: 0,
          ticketPromedio: 0,
          pedidosPendientes: 0,
          topProductos: [],
          ventas7Dias: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            data: [0, 0, 0, 0, 0, 0, 0]
          }
        });
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
      } finally {
        setLoading(false);
      }
    };

<<<<<<< HEAD
    fetchMetricsFromData();
    const interval = setInterval(fetchMetricsFromData, 30000);
=======
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';

<<<<<<< HEAD
  const doughnutData = {
    labels: metrics.ventasPorCajero.map(c => c.nombre),
    datasets: [{
      data: metrics.ventasPorCajero.map(c => c.total),
      backgroundColor: ['#D96704', '#400101', '#F2A81D', '#a60303', '#6c757d'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

=======
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
  const barData = {
    labels: metrics.topProductos.map(p => p.nombre || 'Producto'),
    datasets: [{
      label: 'Unidades vendidas',
<<<<<<< HEAD
      data: metrics.topProductos.map(p => p.vendidos || 0),
=======
      data: metrics.topProductos.map(p => (typeof p.vendidos === 'number' ? p.vendidos : 0)),
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
      backgroundColor: '#D96704',
      borderColor: '#400101',
      borderWidth: 1,
    }],
  };

  const lineData = {
    labels: metrics.ventas7Dias.labels,
    datasets: [{
      label: 'Ventas diarias ($)',
      data: metrics.ventas7Dias.data,
      borderColor: '#D96704',
      backgroundColor: 'rgba(217, 103, 4, 0.1)',
      tension: 0.3,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
<<<<<<< HEAD
    maintainAspectRatio: false,
=======
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-navbar">
        <div className="navbar-logo">
          <span className="logo-text">FastPOS</span>
        </div>
        <nav className="navbar-actions">
          {quickActions.map(action => (
            <button
              key={action.id}
              className="nav-action-btn"
              onClick={() => onSectionChange(action.id)}
            >
              {action.label}
            </button>
          ))}
        </nav>
        <div className="navbar-user">
          <span>Bienvenido, <strong>{displayName}</strong></span>
          <button className="btn-logout" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
<<<<<<< HEAD
=======
        {/* Siempre mostrar las métricas, incluso durante la carga */}
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Ventas Hoy</div>
            <div className="metric-value">${(metrics.ventasHoy || 0).toLocaleString()}</div>
          </div>
          <div className="metric-card1">
            <div className="metric-label">Pedidos Hoy</div>
            <div className="metric-value">{metrics.pedidosHoy || 0}</div>
          </div>
          <div className="metric-card2">
            <div className="metric-label">Ticket Promedio</div>
            <div className="metric-value">${(metrics.ticketPromedio || 0).toLocaleString()}</div>
          </div>
          <div className="metric-card3">
            <div className="metric-label">Pedidos Pendientes</div>
            <div className="metric-value">{metrics.pedidosPendientes || 0}</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
<<<<<<< HEAD
            <h3>Ventas por Cajero</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : metrics.ventasPorCajero.length > 0 ? (
              <Doughnut data={doughnutData} options={{ ...options, plugins: { legend: { position: 'bottom' } } }} />
            ) : (
              <p>No hay ventas registradas.</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Tendencia de Ventas (Últimos 7 días)</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : Array.isArray(metrics.ventas7Dias?.data) ? (
              <Line data={lineData} options={options} />
            ) : (
              <p>Sin datos de ventas.</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Productos Más Vendidos</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : metrics.topProductos.length > 0 ? (
              <Bar data={barData} options={options} />
            ) : (
              <p>No hay productos vendidos.</p>
=======
            <h3>Tendencia de Ventas (Últimos 7 días)</h3>
            {loading ? (
              <p>Cargando datos...</p>
            ) : metrics.ventas7Dias.data.some(v => v > 0) ? (
              <Line data={lineData} options={options} />
            ) : (
              <p>Sin ventas registradas en los últimos 7 días.</p>
            )}
          </div>
          <div className="chart-card">
            <h3>Productos Más Vendidos (Mes)</h3>
            {loading ? (
              <p>Cargando datos...</p>
            ) : metrics.topProductos.length > 0 ? (
              <Bar data={barData} options={options} />
            ) : (
              <p>No hay productos con ventas aún.</p>
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

<<<<<<< HEAD
export default Dashboard;
=======
export default Dashboard;
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a

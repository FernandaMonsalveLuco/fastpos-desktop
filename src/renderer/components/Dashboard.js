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
  Filler
);

import { Bar, Line } from 'react-chartjs-2';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = ({ user, onLogout, onSectionChange }) => {
  // Estado inicial con valores por defecto visibles
  const [metrics, setMetrics] = useState({
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
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';

  const barData = {
    labels: metrics.topProductos.map(p => p.nombre || 'Producto'),
    datasets: [{
      label: 'Unidades vendidas',
      data: metrics.topProductos.map(p => (typeof p.vendidos === 'number' ? p.vendidos : 0)),
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
        {/* Siempre mostrar las métricas, incluso durante la carga */}
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
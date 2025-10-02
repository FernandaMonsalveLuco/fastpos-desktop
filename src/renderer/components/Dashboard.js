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
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Dashboard = ({ user, onLogout, onSectionChange }) => {
  const [metrics, setMetrics] = useState({
    ventasHoy: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    topProductos: [],
    ventas7Dias: { labels: [], data: [] }
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
        // === 1. Ventas de hoy ===
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const ventasHoySnap = await getDocs(
          query(collection(db, 'ventas'), where('fecha', '>=', hoy), where('fecha', '<', manana))
        );
        const ventasHoy = ventasHoySnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
        const pedidosHoy = ventasHoySnap.size;
        const ticketPromedio = pedidosHoy > 0 ? Math.round(ventasHoy / pedidosHoy) : 0;

        // === 2. Ventas últimos 7 días ===
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const snap = await getDocs(
            query(collection(db, 'ventas'), where('fecha', '>=', date), where('fecha', '<', nextDay))
          );
          const total = snap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
          const day = date.toLocaleDateString('es-ES', { weekday: 'short' });
          labels.push(day);
          data.push(total);
        }

        // === 3. Top productos del mes ===
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const ventasMesSnap = await getDocs(
          query(collection(db, 'ventas'), where('fecha', '>=', startOfMonth))
        );

        const productoMap = {};
        ventasMesSnap.docs.forEach(doc => {
          const productos = doc.data().productos || [];
          productos.forEach(p => {
            if (!productoMap[p.nombre]) {
              productoMap[p.nombre] = 0;
            }
            productoMap[p.nombre] += p.cantidad || 1;
          });
        });

        const topProductos = Object.entries(productoMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([nombre, vendidos]) => ({ nombre, vendidos }));

        setMetrics({
          ventasHoy,
          pedidosHoy,
          ticketPromedio,
          topProductos,
          ventas7Dias: { labels, data }
        });
      } catch (error) {
        console.error('Error al cargar métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const barData = {
    labels: metrics.topProductos.map(p => p.nombre),
    datasets: [{
      label: 'Unidades vendidas',
      data: metrics.topProductos.map(p => p.vendidos),
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
          <span>Bienvenido, <strong>{user?.name || 'Usuario'}</strong></span>
          <button className="btn-logout" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Ventas Hoy</div>
            <div className="metric-value">${metrics.ventasHoy.toLocaleString()}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pedidos Hoy</div>
            <div className="metric-value">{metrics.pedidosHoy}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Ticket Promedio</div>
            <div className="metric-value">${metrics.ticketPromedio.toLocaleString()}</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <h3>Tendencia de Ventas (Últimos 7 días)</h3>
            <Line data={lineData} options={options} />
          </div>
          <div className="chart-card">
            <h3>Productos Más Vendidos (Mes)</h3>
            <Bar data={barData} options={options} />
          </div>
        </div>

        {loading && <p className="cargando">Cargando métricas...</p>}
      </main>
    </div>
  );
};

export default Dashboard;
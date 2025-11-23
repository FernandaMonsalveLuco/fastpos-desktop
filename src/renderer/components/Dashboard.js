// src/renderer/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
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
  ArcElement,
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
  Filler,
  ArcElement      
);

const Dashboard = ({ user, onLogout, onSectionChange }) => {
  const [metrics, setMetrics] = useState({
    ventasHoy: 0,
    pedidosHoy: 0,
    ticketPromedio: 0,
    pedidosPendientes: 0,
    topProductos: [],
    ventas7Dias: {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      data: [0, 0, 0, 0, 0, 0, 0]
    },
    ventasPorCajero: []
  });
  const [loading, setLoading] = useState(true);

  // Filtrar acciones según el rol del usuario
  const getQuickActions = () => {
    const baseActions = [
      { id: 'tomarPedido', label: 'Tomar Pedido' },
      { id: 'caja', label: 'Caja' },
      { id: 'pedidos', label: 'Pedidos' },
    ];

    // Meseros solo pueden tomar pedidos
    if (user?.rol === 'mesero') {
      return [
        { id: 'tomarPedido', label: 'Tomar Pedido' }
      ];
    }

    // Cajeros pueden tomar pedidos y acceder a caja
    if (user?.rol === 'cajero') {
      return [
        { id: 'tomarPedido', label: 'Tomar Pedido' },
        { id: 'caja', label: 'Caja' }
      ];
    }

    // Admin tiene acceso a todo
    if (user?.rol === 'admin') {
      return [
        { id: 'tomarPedido', label: 'Tomar Pedido' },
        { id: 'caja', label: 'Caja' },
        { id: 'pedidos', label: 'Pedidos' },
        { id: 'productos', label: 'Productos' },
        { id: 'usuarios', label: 'Usuarios' },
        { id: 'configuracion', label: 'Configuración' },
        { id: 'mesas', label: 'Administrar Mesas' },
      ];
    }

    return baseActions;
  };

  useEffect(() => {
    const fetchMetricsFromData = async () => {
      try {
        // Obtener pedidos (no ventas) para métricas más precisas
        const pedidosSnapshot = await getDocs(collection(db, 'Pedidos'));
        const pedidos = pedidosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date()
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

        pedidos.forEach(pedido => {
          const totalPedido = pedido.total || 0;
          const estadoPedido = pedido.estado?.trim().toLowerCase() || '';

          // Contar pedidos pendientes (en_cocina o en_caja)
          if (estadoPedido === 'en_cocina' || estadoPedido === 'en_caja') {
            pedidosPendientes++;
          }

          // Solo contar pedidos pagados para métricas de ventas
          if (estadoPedido === 'pagado') {
            const cajeroId = pedido.cajeroId || 'desconocido';
            const cajeroNombre = usuariosMap[cajeroId] || 'Desconocido';

            if (!cajerosVentas[cajeroId]) {
              cajerosVentas[cajeroId] = {
                nombre: cajeroNombre,
                total: 0,
                pedidos: 0
              };
            }

            cajerosVentas[cajeroId].total += totalPedido;
            cajerosVentas[cajeroId].pedidos += 1;

            totalVentas += totalPedido;
            totalPedidos++;

            const fechaPedido = pedido.timestamp;
            const fechaSinHora = new Date(fechaPedido);
            fechaSinHora.setHours(0, 0, 0, 0);

            if (fechaSinHora.getTime() === hoy.getTime()) {
              ventasHoy += totalPedido;
              pedidosHoy++;
            }

            if (Array.isArray(pedido.items)) {
              pedido.items.forEach(item => {
                const nombre = item.nombre || 'Producto';
                if (!productosVendidos[nombre]) {
                  productosVendidos[nombre] = 0;
                }
                productosVendidos[nombre] += item.cantidad || 1;
              });
            }

            const diffTime = hoy - fechaSinHora;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
              const diaIndex = fechaSinHora.getDay() === 0 ? 6 : fechaSinHora.getDay() - 1;
              ventasPorDia[diaIndex] += totalPedido;
            }
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
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsFromData();
    const interval = setInterval(fetchMetricsFromData, 30000);
    return () => clearInterval(interval);
  }, [user?.rol]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  const quickActions = getQuickActions();

  // === COLORES ADAPTADOS A OCEAN BREEZE ===
  const primaryDark = '#03045e';
  const primaryMedium = '#0077b6';
  const primaryLight = '#00b4d8';
  const secondary = '#90e0ef';
  const info = '#00b4d8';
  const light = '#e3f2fd';
  const white = '#fff';

  // Generar colores para el gráfico de dona (máximo 5 colores distintos)
  const doughnutColors = [
    primaryMedium,
    primaryLight,
    secondary,
    info,
    'var(--gray-500)'
  ];

  const doughnutData = {
    labels: metrics.ventasPorCajero.map(c => c.nombre),
    datasets: [{
      data: metrics.ventasPorCajero.map(c => c.total),
      backgroundColor: doughnutColors.slice(0, metrics.ventasPorCajero.length),
      borderWidth: 2,
      borderColor: white
    }]
  };

  const barData = {
    labels: metrics.topProductos.map(p => p.nombre || 'Producto'),
    datasets: [{
      label: 'Unidades vendidas',
      data: metrics.topProductos.map(p => (typeof p.vendidos === 'number' ? p.vendidos : 0)),
      backgroundColor: primaryMedium,
      borderColor: primaryDark,
      borderWidth: 2,
    }],
  };

  const lineData = {
    labels: metrics.ventas7Dias.labels,
    datasets: [{
      label: 'Ventas diarias ($)',
      data: metrics.ventas7Dias.data,
      borderColor: primaryLight,
      backgroundColor: `rgba(${parseInt(primaryLight.slice(1), 16) >> 16}, ${parseInt(primaryLight.slice(1), 16) >> 8 & 0xff}, ${parseInt(primaryLight.slice(1), 16) & 0xff}, 0.1)`,
      tension: 0.3,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: { 
      y: { beginAtZero: true },
      x: { ticks: { autoSkip: false } }
    }
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
          {user?.rol === 'admin' && (
            <button
              className="nav-action-btn"
              onClick={() => onSectionChange('reportes')}
              style={{ backgroundColor: '#0077b6', color: 'white' }}
            >
              Reportes
            </button>
          )}
        </nav>
        <div className="navbar-user">
          <span>Bienvenido, <strong>{displayName}</strong></span>
          <button className="btn-logout" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
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
            <h3>Ventas por Cajero</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : metrics.ventasPorCajero.length > 0 ? (
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  ...options, 
                  plugins: { legend: { position: 'bottom' } } 
                }} 
              />
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
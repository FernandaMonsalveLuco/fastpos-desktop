// src/App.js
import React, { useState } from 'react';
import Login from './renderer/components/Login';
import Dashboard from './renderer/components/Dashboard';
import Register from './renderer/components/Register';
import Caja from './renderer/components/Caja';
import TomarPedido from './renderer/components/TomarPedido';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [showRegister, setShowRegister] = useState(false);
  const [carrito, setCarrito] = useState([]); // Carrito compartido

  const handleLogin = (userData) => {
    setUser(userData);
    setShowRegister(false);
    setActiveSection('home');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveSection('home');
    setCarrito([]); // Limpiar carrito al salir
  };

  // Función para agregar productos al carrito (desde TomarPedido)
  const agregarAlCarrito = (productos) => {
    // Asumimos que `productos` es un array (puede ser uno o varios)
    setCarrito(prev => [...prev, ...productos]);
  };

  // Función para vaciar el carrito (desde Caja, después de cobrar)
  const vaciarCarrito = () => {
    setCarrito([]);
  };

  if (showRegister) {
    return <Register onRegisterSuccess={() => setShowRegister(false)} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} onShowRegister={() => setShowRegister(true)} />;
  }

  // Navegación por secciones
  switch (activeSection) {
    case 'caja':
      return (
        <Caja
          user={user}
          carrito={carrito}
          onVaciarCarrito={vaciarCarrito}
          onBack={() => setActiveSection('tomarPedido')}
        />
      );

    case 'tomarPedido':
      return (
        <TomarPedido
          carritoActual={carrito} // Opcional: para mostrar vista previa
          onAgregarAlCarrito={agregarAlCarrito}
          onIrACaja={() => setActiveSection('caja')}
          onBack={() => setActiveSection('home')}
        />
      );

    case 'pedidos':
      return <div className="pedido-container">Pedidos (próximamente)</div>;
    case 'productos':
      return <div className="pedido-container">Productos (próximamente)</div>;
    case 'usuarios':
      return <div className="pedido-container">Usuarios (solo admin)</div>;
    case 'configuracion':
      return <div className="pedido-container">Configuración</div>;

    case 'home':
    default:
      return (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onSectionChange={setActiveSection}
        />
      );
  }
}

export default App;
// src/App.js
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Login from './renderer/components/Login';
import Dashboard from './renderer/components/Dashboard';
import Caja from './renderer/components/Caja';
import TomarPedido from './renderer/components/TomarPedido';
import UsuariosModule from './renderer/components/usuarios/UsuariosModule';
import ProductosModule from './renderer/components/ProductosModule';
import Pedidos from './renderer/components/Pedidos';
import Configuracion from './renderer/components/Configuracion';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Incluirá: uid, email, rol, etc.
  const [loading, setLoading] = useState(true); // Para evitar parpadeo
  const [activeSection, setActiveSection] = useState('home');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [carrito, setCarrito] = useState([]);

  const auth = getAuth();
  const db = getFirestore();

  // 🔄 Escuchar estado de autenticación al cargar la app
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ✅ Cargar datos adicionales desde Firestore
        try {
          const userDoc = await getDoc(doc(db, 'Usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc.data()
            };
            setUser(userData);
          } else {
            console.warn('Documento de usuario no encontrado en Firestore');
            // Opcional: redirigir a perfil para completar registro
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, rol: 'invitado' });
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (firebaseUser) => {
    // Este flujo ya debería haber cargado el user vía onAuthStateChanged
    // Pero si usas login manual, repite la lógica:
    try {
      const userDoc = await getDoc(doc(db, 'Usuarios', firebaseUser.uid));
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...(userDoc.exists() ? userDoc.data() : { rol: 'invitado' })
      };
      setUser(userData);
      setShowRegister(false);
      setShowForgotPassword(false);
      setActiveSection('home');
    } catch (error) {
      console.error('Error post-login:', error);
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    // onAuthStateChanged se encargará de limpiar el estado
  };

  const agregarAlCarrito = (productos) => {
    setCarrito(prev => [...prev, ...productos]);
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  // 🚧 Pantallas fuera del flujo principal
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (showRegister) {
    return <Register onRegisterSuccess={() => setShowRegister(false)} />;
  }

  if (showForgotPassword) {
    return (
      <div className="forgot-password-container">
        <h2>Recuperar Contraseña</h2>
        <p>Funcionalidad de recuperación de contraseña próximamente.</p>
        <button className="btn-volver" onClick={() => setShowForgotPassword(false)}>Volver</button>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} 
        onShowRegister={() => setShowRegister(true)} 
        onShowForgotPassword={() => setShowForgotPassword(true)} 
      />
    );
  }

  // 🔐 Verificar acceso a secciones restringidas
  const isAdmin = user.rol === 'admin';

  if (activeSection === 'usuarios' && !isAdmin) {
    // Redirigir o mostrar error
    alert('Acceso denegado. Solo los administradores pueden gestionar usuarios.');
    setActiveSection('home');
    return null;
  }

  // 🧭 Navegación principal
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
          carritoActual={carrito}
          onAgregarAlCarrito={agregarAlCarrito}
          onEliminarDelCarrito={eliminarDelCarrito} 
          onIrACaja={() => setActiveSection('caja')}
          onBack={() => setActiveSection('home')}
        />
      );

    case 'pedidos':
      return <Pedidos onBack={() => setActiveSection('home')} />;

    case 'productos':
      return <ProductosModule onBack={() => setActiveSection('home')} />;

    case 'usuarios':
      return <UsuariosModule onBack={() => setActiveSection('home')} />;

    case 'configuracion':
      return <Configuracion onBack={() => setActiveSection('home')} />;

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
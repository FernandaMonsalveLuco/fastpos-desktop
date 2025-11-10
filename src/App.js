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
import Recuperar from './renderer/components/auth/Recuperar';
import TipoPago from './renderer/components/TipoPago';
import MesasCRUD from './renderer/components/mesas/MesasCRUD';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [carrito, setCarrito] = useState([]);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (showRegister) {
    // Si usas Register, asegúrate de importarlo. Si no, elimina este bloque.
    // return <Register onRegisterSuccess={() => setShowRegister(false)} />;
    return <Login onLogin={handleLogin} />;
  }

  if (showForgotPassword) {
    return <Recuperar onBack={() => setShowForgotPassword(false)} />;
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

  const isAdmin = user.rol === 'admin';

  if (activeSection === 'usuarios' && !isAdmin) {
    alert('Acceso denegado. Solo los administradores pueden gestionar usuarios.');
    setActiveSection('home');
    return null;
  }

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
    case 'mesas':
      return <MesasCRUD onBack={() => setActiveSection('home')} />;

    case 'tomarPedido':
      return <TomarPedido onBack={() => setActiveSection('home')} />;
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
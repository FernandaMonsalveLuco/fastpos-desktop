# fastpos-desktop
Claro, aquí tienes un **`README.md` profesional y completo** para tu proyecto **FastPOS – Sistema de Gestión para Pizzería**, basado en lo que hemos visto en tus componentes (`Login`, `TomarPedido`, `Caja`, Firebase, etc.):

---

# 🍕 FastPOS – Sistema de Punto de Venta para Pizzería

FastPOS es una aplicación web moderna construida con **React** y **Firebase** que permite a los restaurantes gestionar pedidos, procesar pagos en caja y registrar ventas en tiempo real. Ideal para pizzerías que buscan una solución simple, rápida y sin costos de licencia.

![FastPOS Demo](https://via.placeholder.com/800x400?text=FastPOS+Demo) <!-- Reemplaza con screenshot real si deseas -->

## 🚀 Características

- ✅ **Autenticación segura** con Firebase Authentication (login y registro)
- 📝 **Toma de pedidos intuitiva** por categorías (pizzas, bebidas, postres, etc.)
- 🛒 **Carrito persistente** entre secciones (Tomar Pedido → Caja)
- 💳 **Registro de ventas** en Firestore con total, IVA y desglose de productos
- 🔐 **Roles de usuario** (futuro: admin vs cajero)
- 📱 **Diseño responsive** para uso en tablets o PCs de caja

## 🛠 Tecnologías utilizadas

- **Frontend**: React 18, React Router DOM
- **Estilos**: CSS puro (modular y personalizable)
- **Backend**: Firebase (Authentication + Firestore)
- **Desarrollo**: Webpack / Vite (según tu configuración), GitHub Codespaces compatible

## 📦 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/fastpos.git
   cd fastpos
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configura Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita **Authentication** (método: correo/contraseña)
   - Crea una base de datos **Firestore** en modo prueba (solo para desarrollo)
   - Agrega una colección `Productos` con documentos como:
     ```js
     {
       nombre: "Pizza Margarita",
       precio: 12000,
       categoria: "pizzas"
     }
     ```
   - Descarga tu archivo de configuración y reemplaza en `src/renderer/firebase.js`:
     ```js
     const firebaseConfig = {
       apiKey: "...",
       authDomain: "...",
       projectId: "...",
       // ... etc
     };
     ```

4. **Inicia la app en modo desarrollo**
   ```bash
   npm start
   # o
   yarn start
   ```

La app se abrirá en `http://localhost:3000`.

> Si usas **GitHub Codespaces**, ignora los errores de WebSocket 404; son normales en entornos remotos.

## Uso

1. **Regístrate** como primer usuario (serás admin por defecto).
2. **Inicia sesión**.
3. En el panel principal:
   - Haz clic en **"Tomar Pedido"**
   - Selecciona productos por categoría
   - Revisa tu orden y haz clic en **"Ingresar"**
4. En **Caja**:
   - Verifica el total con IVA (19%)
   - Haz clic en **"Pagar Pedido"** para registrar la venta en Firestore

## Estructura del proyecto

```
src/
├── renderer/
│   ├── components/     # Componentes de la app (Login, Caja, TomarPedido, etc.)
│   └── firebase.js     # Configuración de Firebase
├── App.js              # Gestión del estado global (usuario, carrito, navegación)
├── index.js            # Punto de entrada
└── App.css             # Estilos globales
```

## Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.

---

## ¿Necesitas ayuda?

- ¿No carga el menú? → Verifica que la colección `Productos` exista en Firestore.
- ¿Error `app.auth is not a function`? → Usa la sintaxis modular de Firebase v9+.
- ¿El carrito no se pasa a Caja? → Asegúrate de usar el estado elevado en `App.js`.

---
**Consejo**: Instala [React Developer Tools](https://reactjs.org/link/react-devtools) para depurar componentes y estado en tiempo real.

---

¿Quieres que genere también un `package.json` de ejemplo o instrucciones para producción (`npm run build`)?

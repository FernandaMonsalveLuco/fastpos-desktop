// init-db.js
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fastpos-b9692',
});

const db = admin.firestore();

// CREAR CLIENTES
async function createClients() {
  const clientes = [
    { email: 'carlos.lopez@email.com', nombre: 'Carlos López' },
    { email: 'ana.martinez@email.com', nombre: 'Ana Martínez' },
    { email: 'luis.rodriguez@email.com', nombre: 'Luis Rodríguez' },
  ];

  for (const c of clientes) {
    await db.collection('Clientes').add({
      ...c,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log('Success: Clientes creados');
}

// CREAR USUARIOS (Dentro de la empresa)
async function createInitialUsers() {
  const users = [
    {
      email: 'admin@fastpos.com',
      password: 'Admin123!',
      name: 'Administrador',
      rol: 'admin'
    },
    {
      email: 'user@fastpos.com',
      password: 'User123!',
      name: 'Usuario Ejemplo',
      rol: 'user'
    }
  ];

  const userMap = {};

  for (const user of users) {
    try {
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password,
        displayName: user.name,
      });

      await db.collection('Usuarios').doc(userRecord.uid).set({
        name: user.name,
        email: user.email,
        rol: user.rol,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Success: Usuario creado: ${user.email} (UID: ${userRecord.uid})`);
      userMap[user.email] = userRecord.uid;
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        const existingUser = await admin.auth().getUserByEmail(user.email);
        userMap[user.email] = existingUser.uid;
        console.log(`Warning: Usuario ya existe: ${user.email} (UID: ${existingUser.uid})`);
      } else {
        console.error(`Error al crear ${user.email}:`, error.message);
      }
    }
  }

  return userMap;
}

// CREAR PRODUCTOS 
async function createProducts() {
  const productos = [
    { nombre: 'Pizza Margarita', precio: 12000, categoria: 'pizzas', stock: 50 },
    { nombre: 'Pizza Pepperoni', precio: 14000, categoria: 'pizzas', stock: 40 },
    { nombre: 'Pizza Hawaiana', precio: 13000, categoria: 'pizzas', stock: 30 },
    { nombre: 'Pizza Vegetariana', precio: 12500, categoria: 'pizzas', stock: 35 },
    { nombre: 'Gaseosa 500ml', precio: 3000, categoria: 'bebidas', stock: 100 },
    { nombre: 'Agua Mineral', precio: 2000, categoria: 'bebidas', stock: 120 },
    { nombre: 'Cerveza Artesanal', precio: 5000, categoria: 'bebidas', stock: 60 },
    { nombre: 'Tiramisú', precio: 6000, categoria: 'postres', stock: 25 },
    { nombre: 'Brownie con Helado', precio: 7000, categoria: 'postres', stock: 20 },
    { nombre: 'Combo Familiar', precio: 28000, categoria: 'combos', stock: 15 },
  ];

  for (const p of productos) {
    await db.collection('Productos').add(p);
  }
  console.log(`Success: ${productos.length} productos creados.`);
}

// CREAR CATEGORÍAS 
async function createCategories() {
  const categorias = ['pizzas', 'bebidas', 'postres', 'combos'];
  for (const cat of categorias) {
    await db.collection('Categorias').add({ nombre: cat });
  }
  console.log(`Success: ${categorias.length} categorías creadas.`);
}

// CREAR VENTAS (ejemplos)
async function createSales(userMap) {
  const ventas = [
    {
      cajeroId: userMap['user@fastpos.com'],
      cajeroNombre: 'Usuario Ejemplo',
      productos: [
        { nombre: 'Pizza Margarita', precio: 12000, cantidad: 1, subtotal: 12000 },
        { nombre: 'Gaseosa 500ml', precio: 3000, cantidad: 2, subtotal: 6000 },
      ],
      total: 18000,
      estado: 'completada',
      tipo: 'pizzeria'
    },
    {
      cajeroId: userMap['user@fastpos.com'],
      cajeroNombre: 'Usuario Ejemplo',
      productos: [
        { nombre: 'Combo Familiar', precio: 28000, cantidad: 1, subtotal: 28000 },
      ],
      total: 28000,
      estado: 'completada',
      tipo: 'pizzeria'
    }
  ];

  for (let i = 0; i < ventas.length; i++) {
    const venta = ventas[i];
    const diasAtras = i;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    fecha.setHours(fecha.getHours() - 2);

    await db.collection('ventas').add({
      ...venta,
      fecha: admin.firestore.Timestamp.fromDate(fecha)
    });
  }

  console.log(`Success: ${ventas.length} ventas creadas.`);
}

// EJECUCIÓN PRINCIPAL 
async function main() {
  console.log('Loading: Iniciando inicialización de base de datos...');

  const userMap = await createInitialUsers();
  await createCategories();
  await createProducts();
  await createSales(userMap);
  await createClients();

  console.log('Succes: Base de datos inicializada con éxito');
  process.exit();
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
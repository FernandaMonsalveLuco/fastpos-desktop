// src/main/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../../src/preload.js'), // Ruta correcta desde main.js
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Cargar la app React (desarrollo o producción)
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000'); // Tu dev server de React
  } else {
    win.loadFile(path.join(__dirname, '../../build/index.html')); // Build de React
  }

  // Abrir DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

// Eventos IPC
ipcMain.on('close-window', () => {
  app.quit();
});

ipcMain.on('reload-app', () => {
  BrowserWindow.getFocusedWindow()?.reload();
});

// Iniciar app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
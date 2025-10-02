// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ejemplo: cerrar ventana
  closeWindow: () => ipcRenderer.send('close-window'),
  // Ejemplo: recargar la app
  reloadApp: () => ipcRenderer.send('reload-app'),
  // Puedes añadir más funciones si las necesitas
});
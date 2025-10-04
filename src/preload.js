<<<<<<< HEAD
// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ejemplo: cerrar ventana
  closeWindow: () => ipcRenderer.send('close-window'),
  // Ejemplo: recargar la app
  reloadApp: () => ipcRenderer.send('reload-app'),
  // Puedes añadir más funciones si las necesitas
=======
// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ejemplo: cerrar ventana
  closeWindow: () => ipcRenderer.send('close-window'),
  // Ejemplo: recargar la app
  reloadApp: () => ipcRenderer.send('reload-app'),
  // Puedes añadir más funciones si las necesitas
>>>>>>> 86b555ffb3815af35a95898ae28bba5a43b86b8a
});
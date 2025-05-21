const { contextBridge, ipcRenderer } = require('electron');

// Exponer funciones seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electron', {
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window')
}); 
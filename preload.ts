import { contextBridge, ipcRenderer } from 'electron';

declare global {
  interface Window {
    electron?: {
      maximize: () => void;
      close: () => void;
    };
  }
}

contextBridge.exposeInMainWorld('electron', {
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window')
});


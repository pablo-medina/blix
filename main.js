const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Maximizar la ventana al iniciar
  win.maximize();

  win.loadFile('index.html');
  // Descomentar la siguiente línea para abrir las herramientas de desarrollo
  // win.webContents.openDevTools();

  // Exponer la función de maximizar al proceso de renderizado
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      window.electron = {
        maximize: () => {
          require('electron').ipcRenderer.send('maximize-window');
        }
      };
    `);
  });
}

// Manejar la solicitud de maximizar desde el proceso de renderizado
ipcMain.on('maximize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.maximize();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Maximizar la ventana al iniciar
  win.maximize();

  win.loadFile('index.html');
  // Descomentar la siguiente línea para abrir las herramientas de desarrollo
  // win.webContents.openDevTools();
}

// Manejar la solicitud de maximizar desde el proceso de renderizado
ipcMain.on('maximize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.maximize();
  }
});

// Manejar la solicitud de cerrar la ventana
ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.close();
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
const { spawn } = require('child_process');
const path = require('path');

// Obtener la ruta al ejecutable de electron
const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

// Ejecutar electron con el directorio actual como argumento
const electronProcess = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    shell: true
});

electronProcess.on('error', (error) => {
    console.error('Error al iniciar Electron:', error);
});

electronProcess.on('close', (code) => {
    console.log(`Electron se cerró con código ${code}`);
}); 
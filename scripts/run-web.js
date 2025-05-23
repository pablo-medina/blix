const { spawn } = require('child_process');
const open = require('open').default;
const path = require('path');
const fs = require('fs');

// Ejecutar webpack en modo producción
console.log('🔄 Compilando versión web...');
const webpackProcess = spawn('webpack', ['--mode', 'production'], {
    stdio: 'inherit',
    shell: true
});

webpackProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Error en la compilación de webpack');
        return;
    }

    // Construir la ruta al archivo index.html
    const indexPath = path.resolve(__dirname, '..', 'dist', 'web', 'index.html');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(indexPath)) {
        console.error('❌ Error: No se encontró index.html en', indexPath);
        return;
    }

    // Convertir a URL file://
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
    console.log('🌐 Abriendo URL:', fileUrl);
    
    // Abrir en el navegador por defecto
    open(fileUrl).catch(err => {
        console.error('❌ Error al abrir el navegador:', err);
    });
}); 
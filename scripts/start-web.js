const { exec } = require('child_process');
const open = require('open').default;
const path = require('path');
const fs = require('fs');

// Ejecutar webpack build
console.log('Building web version...');
exec('webpack --mode production', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error building: ${error}`);
        return;
    }
    if (stderr) {
        console.error(`Build stderr: ${stderr}`);
        return;
    }
    console.log(`Build stdout: ${stdout}`);

    // Construir la ruta absoluta al archivo index.html en dist/web
    const indexPath = path.resolve(__dirname, '..', 'dist', 'web', 'index.html');
    console.log('Trying to open file at:', indexPath);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(indexPath)) {
        console.error('Error: index.html not found at', indexPath);
        return;
    }

    // Convertir a URL file://
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
    console.log('Opening URL:', fileUrl);
    
    // Abrir en el navegador por defecto
    console.log('Opening in default browser...');
    open(fileUrl).catch(err => {
        console.error(`Error opening browser: ${err}`);
    });
}); 
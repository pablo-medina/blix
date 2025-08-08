const { spawn } = require('child_process');
const open = require('open').default;
const path = require('path');
const fs = require('fs');

// Run webpack in production mode
console.log('🔄 Building web version...');
const webpackProcess = spawn('webpack', ['--mode', 'production'], {
    stdio: 'inherit',
    shell: true
});

webpackProcess.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Error en la compilación de webpack');
        return;
    }

    // Build path to index.html
    const indexPath = path.resolve(__dirname, '..', 'dist', 'web', 'index.html');
    
    // Verify file exists
    if (!fs.existsSync(indexPath)) {
        console.error('❌ Error: index.html not found at', indexPath);
        return;
    }

    // Convert path to file:// URL
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
    console.log('🌐 Opening URL:', fileUrl);
    
    // Open in default browser
    open(fileUrl).catch(err => {
        console.error('❌ Error opening browser:', err);
    });
}); 
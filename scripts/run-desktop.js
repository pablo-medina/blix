const { spawn } = require('child_process');
const path = require('path');

// Resolve path to electron executable
const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

// Launch electron with current directory as argument
const electronProcess = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    shell: true
});

electronProcess.on('error', (error) => {
    console.error('Failed to start Electron:', error);
});

electronProcess.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
}); 
// Importar el juego
import './game.js';

// Configuración específica de Electron
if (window.electron) {
    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Running in Electron environment');
        // Aquí puedes agregar cualquier inicialización específica de Electron
    });
} 
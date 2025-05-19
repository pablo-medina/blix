document.addEventListener('DOMContentLoaded', function() {
// Basic canvas configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Adjust canvas size when resizing window 
function adjustCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Maintain 4:3 aspect ratio
    let newWidth, newHeight;
    if (windowWidth / windowHeight > 4/3) {
        // Window is wider than tall, adjust by height
        newHeight = windowHeight * 0.95; // Use 95% of available height
        newWidth = newHeight * (4/3);
    } else {
        // Window is taller than wide, adjust by width
        newWidth = windowWidth * 0.95; // Use 95% of available width
        newHeight = newWidth * (3/4);
    }
    
    // Round to integers
    newWidth = Math.floor(newWidth);
    newHeight = Math.floor(newHeight);
    
    // Apply changes
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
    
    // Center canvas
    canvas.style.position = 'absolute';
    canvas.style.left = ((windowWidth - newWidth) / 2) + 'px';
    canvas.style.top = ((windowHeight - newHeight) / 2) + 'px';
    
    console.debug(`Canvas adjusted: ${newWidth}x${newHeight}`);
}

// Apply initial adjustment and configure event
window.addEventListener('resize', adjustCanvas);
adjustCanvas();

// Game configuration
const paddleHeight = 16;
const paddleWidth = 120;
const brickRowCount = 6;
const brickColumnCount = 13;
const brickWidth = 45;
const brickHeight = 25;
const brickPadding = 2;
const brickOffsetTop = 45;
const brickOffsetLeft = 10;

// Side panel
const sidePanelWidth = 170; // Adjusted to maintain symmetry
const sidePanelColor = '#1a1a2e';
const sidePanelBorderColor = '#2a2a3e';

// Configuration of the game border
const borderThickness = 6;
const gameBorder = {
    top: 35,
    left: borderThickness,
    right: canvas.width - sidePanelWidth - borderThickness,
    bottom: canvas.height
};

// Variables for gradual speed increase
// const speedIncreaseInterval = 10; // seconds between each increase
// const speedIncreasePercentage = 0.05; // 5% faster each time
// let speedIncreaseTimer = 0; // timer for next increase
// let speedMultiplier = 1.0; // base speed multiplier

// --- NIVELES ---
const levels = [
  [
    'WWWWWWWWWWWWWWW', // White
    'YYYYYYYYYYYYYYY', // Yellow
    'RRRRRRRRRRRRRRR', // Red
    'GGGGGGGGGGGGGGG', // Green
    'OOOOOOOOOOOOOOO', // Orange
    'PPPPPPPPPPPPPPP'  // Purple
  ],
  [
    '###############', // Cyan (indestructible)
    '222222222222222', // Gray
    'WWWWWWWWWWWWWWW', // White
    'WWWWWWWWWWWWWWW', // White
    'WWWWWWWWWWWWWWW', // White
    'WWWWWWWWWWWWWWW'  // White
  ],
  [
    '#             #', // Cyan (indestructible)
    '2             2', // Gray
    'W             W', // White
    'W    WWWWW    W', // White
    '2             2', // Gray
    '#             #'  // Cyan (indestructible)
  ]
];

// Function to create a new ball
function createBall(x, y, launch = false) {
    const ball = {
        x: x || canvas.width / 2,
        y: y || canvas.height - 30,
        dx: 0,
        dy: 0,
        radius: 8,
        baseSpeed: 3.0
    };
    
    if (launch) {
        // Calculate dx/dy proportionally to baseSpeed
        // Using an angle of approximately 35 degrees (0.6 radians) so dy is ~45% larger than dx
        const angle = 0.6;
        ball.dx = ball.baseSpeed * Math.cos(angle);
        ball.dy = -ball.baseSpeed * Math.sin(angle);
        
        // Verify that the resulting speed is exactly baseSpeed
        const actualSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        console.debug(`Ball launched with speed: ${actualSpeed.toFixed(2)} (target: ${ball.baseSpeed})`);
    }
    
    return ball;
}

// Game objects
let balls = [createBall()]; // Change from const to let

const paddle = {
    x: (canvas.width - paddleWidth) / 2,
    y: canvas.height - paddleHeight - 20,
    speed: 4,
    width: paddleWidth,
    height: paddleHeight
};

// Control variables
let rightPressed = false;
let leftPressed = false;
let score = 0;
let lives = 3;
let currentLevel = 0;

// Transition states
let showLevelMessage = false;
let showGameOver = false;
let transitionTimeout = null;
let gameOverHandled = false;
let waitingToLaunch = false;
let waitBallOnPaddle = false;
let launchTimeout = null;

// Paddle destruction animation
let paddleDestructionFrames = 0;
let isPaddleDestroyed = false;

// Variables for power-up effects
let paddleOriginalWidth = paddleWidth;
let paddleOriginalHeight = paddleHeight;

// Active power-ups
let activePowerUps = {
    sizeStack: 0, // -5 to +5
    speedStack: 0, // -5 to +5
    invincible: false, // New power-up that allows bouncing on the bottom
    fireBall: false, // New power-up for fire balls
    doubleSize: false // New power-up that quadruples ball size
};
let speedStackTimer = 0;

// --- MENÚ ---
const menuOptions = [
    'Start Game',
    'Mute/Unmute Music',
    'View Controls',
    'Exit Game'
];
let menuActive = true;
let selectedMenu = 0;
let showControls = false;

// Variables for title animation
let titleHue = 0;
let titleScale = 1;
let titleAngle = 0;
let titleY = 0;
let titleDirection = 1; // 1: subiendo, -1: bajando

// --- PAUSE ---
let paused = false;

// --- POWER-UPS DURATION ---
const POWERUP_DURATION = 10; // seconds (adjusted)
const INVINCIBLE_DURATION = 15; // seconds for invincible power-up
const DOUBLE_SIZE_DURATION = 15; // seconds for double size power-up
let powerUpTimers = {
    sizeStack: 0,
    speedStack: 0,
    invincible: 0,
    fireBall: 0, // Timer for fire power-up
    doubleSize: 0 // Timer for double size power-up
};
let powerUpBarAlpha = {
    sizeStack: 0,
    speedStack: 0,
    invincible: 0,
    fireBall: 0, // Alpha for fire bar
    doubleSize: 0 // Alpha for double size bar
};

// Game variables
let gameLoopId = null; // To control the main loop
let menuLoopId = null; // To control the menu loop

// Visual effects
let brickExplosions = []; // Brick explosion animations
let fadeOutBlocks = []; // Fading blocks animation

// Initialize bricks
let bricks = [];

// Event listeners for keyboard
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('keydown', menuKeyDownHandler);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function menuKeyDownHandler(e) {
    console.debug("menuKeyDownHandler called, menuActive=", menuActive);
    if (!menuActive) return;
    if (e.key === 'ArrowUp') {
        selectedMenu = (selectedMenu - 1 + menuOptions.length) % menuOptions.length;
        // Sound for menu option movement
        audioBounce.currentTime = 0;
        audioBounce.play().catch(err => console.debug("Error playing menu sound:", err));
        drawMenu();
    } else if (e.key === 'ArrowDown') {
        selectedMenu = (selectedMenu + 1) % menuOptions.length;
        // Sound for menu option movement
        audioBounce.currentTime = 0;
        audioBounce.play().catch(err => console.debug("Error playing menu sound:", err));
        drawMenu();
    } else if (e.key === 'Enter') {
        // Selection sound
        audioMetalClick.currentTime = 0;
        audioMetalClick.play().catch(err => console.debug("Error playing selection sound:", err));
        
        if (showControls) {
            showControls = false;
            drawMenu();
            return;
        }
        switch (selectedMenu) {
            case 0: // Start Game
                console.debug("Start Game selected, current state:", {
                    menuActive,
                    menuLoopId,
                    gameLoopId,
                    currentLevel
                });
                // Stop menu loop first
                if (menuLoopId) {
                    console.debug("Canceling menuLoopId:", menuLoopId);
                    cancelAnimationFrame(menuLoopId);
                    menuLoopId = null;
                }
                // Then start the game
                startGame();
                break;
            case 1: // Mute/Unmute Music
                backgroundMusic.muted = !backgroundMusic.muted;
                if (backgroundMusic.paused && !backgroundMusic.muted) {
                    backgroundMusic.play().catch(err => console.debug("Error reactivating music:", err));
                }
                drawMenu();
                break;
            case 2: // View Controls
                showControls = true;
                drawMenu();
                break;
            case 3: // Exit Game
                if (typeof window.close === 'function') {
                    window.close();
                } else {
                    if (typeof window.electron !== 'undefined') {
                        window.electron.close();
                    } else {
                        alert('Window cannot be closed automatically. Please close the window manually.');
                    }
                }
                break;
        }
    }
}

// Support for gamepad using native API
window.addEventListener("gamepadconnected", (e) => {
    console.debug("Gamepad connected:", e.gamepad);
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.debug("Gamepad disconnected:", e.gamepad);
});

function checkGamepad() {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        const gamepad = gamepads[0];
        const axisX = gamepad.axes[0];
        if (Math.abs(axisX) > 0.2) {
            if (axisX > 0.2) {
                rightPressed = true;
                leftPressed = false;
            } else if (axisX < -0.2) {
                leftPressed = true;
                rightPressed = false;
            }
        } else {
            rightPressed = false;
            leftPressed = false;
        }
    }
}

// Sounds
const audioBounce = new Audio('sounds/pingpongbat.ogg');
const audioBrick = new Audio('sounds/hit01.wav');
const audioMetalClick = new Audio('sounds/Metal Click.wav'); // New sound for indestructible blocks

// Background music in loop
const backgroundMusic = new Audio('sounds/Neon Bricks Dance.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // You can adjust the volume if desired

// Audio analysis variables
let audioContext = null;
let analyser = null;
let dataArray = null;
let source = null;
let audioInitialized = false;

// Improved function to initialize audio
function initAudioAnalysis() {
    if (audioInitialized) {
        console.debug("Audio analyzer already initialized");
        return;
    }

    try {
        // Create audio context only if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.debug("AudioContext created");
        }

        // Create analyzer
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Connect music to analyzer
        if (!source) {
            source = audioContext.createMediaElementSource(backgroundMusic);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            console.debug("Audio source connected to analyzer");
        }

        // Events to monitor music state
        backgroundMusic.addEventListener('play', () => {
            console.debug("Music started - Analyzer active");
            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        });
        
        backgroundMusic.addEventListener('pause', () => {
            console.debug("Music paused - Analyzer inactive");
        });
        
        backgroundMusic.addEventListener('timeupdate', () => {
            if (debugCounter % 30 === 0) { // Reduce log frequency
                console.debug(`Current time: ${backgroundMusic.currentTime.toFixed(2)}s`);
            }
        });

        audioInitialized = true;
        console.debug("Audio analysis initialized successfully with FFT size:", analyser.fftSize);
    } catch (error) {
        console.debug("Error initializing audio analysis:", error);
        // Don't reset variables here, we'll try to reinitialize later
    }
}

// Modify initBackgroundMusic function to ensure correct initialization
function initBackgroundMusic() {
    // Try to initialize audio analysis
    initAudioAnalysis();
    
    // Try to play music
    backgroundMusic.play().catch(error => {
        console.debug("Error playing music, waiting for user interaction:", error);
    });
}

// Modify click event to ensure initialization
document.addEventListener('click', function playOnClick() {
    if (backgroundMusic.paused) {
        // Ensure audio is initialized
        if (!audioInitialized) {
            initAudioAnalysis();
        }
        
        backgroundMusic.play().then(() => {
            console.debug("Music started by user interaction");
            document.removeEventListener('click', playOnClick);
        }).catch(error => {
            console.debug("Error playing music on click:", error);
        });
    }
});

// Modify keydown event to ensure initialization
const playOnKey = function(e) {
    if (backgroundMusic.paused) {
        // Ensure audio is initialized
        if (!audioInitialized) {
            initAudioAnalysis();
        }
        
        backgroundMusic.play().then(() => {
            console.debug("Music started by user interaction (keyboard)");
            document.removeEventListener('keydown', playOnKey);
        }).catch(error => {
            console.debug("Error playing music on keydown:", error);
        });
    }
};

// --- POWER-UPS ---
const POWERUP_TYPES = [
    { type: 'E+', color: '#2196f3' }, // Larger paddle
    { type: 'E-', color: '#2196f3' }, // Smaller paddle
    { type: 'S+', color: '#ff9800' }, // Faster ball
    { type: 'S-', color: '#ff9800' }, // Slower ball
    { type: 'V', color: '#ffd600' },   // Extra life
    { type: 'B', color: '#4caf50' },   // Barrier (bottom bounce)
    { type: '+', color: '#e91e63' },   // Extra ball
    { type: 'F', color: '#ff4500' },   // Fire ball
    { type: 'D', color: '#9c27b0' }    // Double size ball
];

let powerUps = [];

// Global angle for power-up rotation
let powerUpAngle = 0;

function spawnPowerUp(x, y) {
    // 70% chance to drop a power-up and maximum 3 on screen
    if (powerUps.length < 3 && Math.random() < 0.70) {
        // Get available power-up types (excluding those already falling)
        const availableTypes = POWERUP_TYPES.filter(p => 
            !powerUps.some(existing => existing.type === p.type)
        );
        
        // If there are available types, spawn one
        if (availableTypes.length > 0) {
            const p = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            powerUps.push({
                x,
                y,
                type: p.type,
                color: p.color,
                width: 28,
                height: 28,
                dy: 1 // Fixed fall speed
            });
        }
    }
}

function drawPowerUps() {
    // Power-ups as cubes rotating on Y axis (vertical)
    const d = 6;
    powerUps.forEach(pu => {
        // Cube center
        const cx = pu.x + pu.width / 2;
        const cy = pu.y + pu.height / 2;
        const w = pu.width;
        const h = pu.height;
        // Y-axis rotation (vertical)
        const angle = powerUpAngle;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        // Y-axis projection: x' = x, y' = y*cosA + z*sinA
        function proj(x, y, z) {
            return {
                x: cx + x,
                y: cy + y * cosA + z * sinA
            };
        }
        // Faces
        // Front face (z=0)
        const f0 = proj(-w/2, -h/2, 0);
        const f1 = proj(w/2, -h/2, 0);
        const f2 = proj(w/2, h/2, 0);
        const f3 = proj(-w/2, h/2, 0);
        // Side face (z=0 to z=-d, y=h/2)
        const l0 = proj(-w/2, h/2, 0);
        const l1 = proj(w/2, h/2, 0);
        const l2 = proj(w/2, h/2, -d);
        const l3 = proj(-w/2, h/2, -d);
        // Top face (z=0 to z=-d, y=-h/2)
        const s0 = proj(-w/2, -h/2, 0);
        const s1 = proj(w/2, -h/2, 0);
        const s2 = proj(w/2, -h/2, -d);
        const s3 = proj(-w/2, -h/2, -d);
        
        // Front face
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.closePath();
        ctx.fillStyle = pu.color;
        ctx.fill();
        
        // Texture on front face
        ctx.save();
        // Define clip for front face
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.closePath();
        ctx.clip();
        // Text
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type, cx, cy);
        ctx.restore();
        
        // Side face
        ctx.beginPath();
        ctx.moveTo(l0.x, l0.y);
        ctx.lineTo(l1.x, l1.y);
        ctx.lineTo(l2.x, l2.y);
        ctx.lineTo(l3.x, l3.y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(pu.color, -20); // Darker version of color
        ctx.fill();
        
        // Texture on side face (only if visible)
        if (cosA > 0) {
            ctx.save();
            // Define clip for side face
            ctx.beginPath();
            ctx.moveTo(l0.x, l0.y);
            ctx.lineTo(l1.x, l1.y);
            ctx.lineTo(l2.x, l2.y);
            ctx.lineTo(l3.x, l3.y);
            ctx.closePath();
            ctx.clip();
            // Calculate center and projected size
            const centerX = (l0.x + l1.x + l2.x + l3.x) / 4;
            const centerY = (l0.y + l1.y + l2.y + l3.y) / 4;
            const scaleX = Math.min(1, cosA); // Scale based on face visibility
            // Apply text with transformation
            ctx.translate(centerX, centerY);
            ctx.scale(scaleX, 1);
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pu.type, 0, 0);
            ctx.restore();
        }
        
        // Top face
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.closePath();
        ctx.fillStyle = shadeColor(pu.color, 20); // Lighter version of color
        ctx.fill();
        
        // Texture on top face (only if visible)
        if (cosA < 0.9) {
            ctx.save();
            // Define clip for top face
            ctx.beginPath();
            ctx.moveTo(s0.x, s0.y);
            ctx.lineTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.lineTo(s3.x, s3.y);
            ctx.closePath();
            ctx.clip();
            // Calculate center and projected size
            const centerX = (s0.x + s1.x + s2.x + s3.x) / 4;
            const centerY = (s0.y + s1.y + s2.y + s3.y) / 4;
            const scaleY = Math.abs(sinA); // Scale based on face visibility
            // Apply text with transformation
            ctx.translate(centerX, centerY);
            ctx.scale(1, scaleY);
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pu.type, 0, 0);
            ctx.restore();
        }
    });
}

// Helper function to darken or lighten a color
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;  
    G = (G < 255) ? G : 255;  
    B = (B < 255) ? B : 255;  

    R = (R > 0) ? R : 0;  
    G = (G > 0) ? G : 0;  
    B = (B > 0) ? B : 0;  

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#"+RR+GG+BB;
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        pu.y += pu.dy; // Use the same base speed for every power-up
        // if the paddle catches it
        if (
            pu.y + pu.height > paddle.y &&
            pu.x + pu.width > paddle.x &&
            pu.x < paddle.x + paddle.width &&
            pu.y < paddle.y + paddle.height
        ) {
            activatePowerUp(pu.type);
            powerUps.splice(i, 1);
        } else if (pu.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(type) {
    switch (type) {
        case 'E+':
            if (activePowerUps.sizeStack < 5) activePowerUps.sizeStack++;
            powerUpTimers.sizeStack = POWERUP_DURATION;
            break;
        case 'E-':
            if (activePowerUps.sizeStack > -5) activePowerUps.sizeStack--;
            powerUpTimers.sizeStack = POWERUP_DURATION;
            break;
        case 'S+':
            if (activePowerUps.speedStack < 5) activePowerUps.speedStack++;
            powerUpTimers.speedStack = POWERUP_DURATION;
            speedStackTimer = 0;
            break;
        case 'S-':
            if (activePowerUps.speedStack > -5) activePowerUps.speedStack--;
            powerUpTimers.speedStack = POWERUP_DURATION;
            speedStackTimer = 0;
            break;
        case 'V':
            lives++;
            break;
        case 'B':
            activePowerUps.invincible = true;
            powerUpTimers.invincible = INVINCIBLE_DURATION;
            bottomBorderBlink = false;
            bottomBorderAlpha = 1.0;
            break;
        case '+':
            // Add a new ball
            const newBall = createBall(paddle.x + paddle.width / 2, paddle.y - 8);
            balls.push(newBall);
            break;
        case 'F':
            activePowerUps.fireBall = true;
            powerUpTimers.fireBall = POWERUP_DURATION;
            break;
        case 'D':
            activePowerUps.doubleSize = true;
            powerUpTimers.doubleSize = DOUBLE_SIZE_DURATION;
            break;
    }
    applyStackedPowerUps();
}

function applyStackedPowerUps() {
    // Paddle size
    const sizeFactor = 1 + 0.15 * activePowerUps.sizeStack;
    paddle.width = Math.max(40, paddleOriginalWidth * sizeFactor);
    
    // Ball speed - aplicar a cada bola individualmente
    const speedFactor = 1 + 0.18 * activePowerUps.speedStack;
    
    // Aplicar velocidad a cada bola
    for (let ball of balls) {
        // Asegurar que la bola tenga una velocidad base
        if (!ball.baseSpeed) {
            ball.baseSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        }
        
        // Aplicar solo el factor de power-ups, sin el multiplicador gradual
        const finalSpeed = ball.baseSpeed * speedFactor;
        setBallSpeed(ball, finalSpeed);
    }
    
    // IMPORTANT: Ensure the paddle speed never changes
    paddle.speed = 4;
    
    // Music - limit to a reasonable range
    backgroundMusic.playbackRate = Math.max(0.5, Math.min(1.5, 1 + 0.12 * activePowerUps.speedStack));
    
    console.debug(`Speed applied: PowerUp=${speedFactor.toFixed(2)}`);
}

function getBallAngle(ball) {
    return Math.atan2(ball.dy, ball.dx);
}

function setBallSpeed(ball, speed) {
    const angle = getBallAngle(ball);
    const signDx = ball.dx >= 0 ? 1 : -1;
    const signDy = ball.dy >= 0 ? 1 : -1;
    ball.dx = Math.abs(Math.cos(angle) * speed) * signDx;
    ball.dy = Math.abs(Math.sin(angle) * speed) * signDy;
}

function drawBall(ball) {
    // Ball as sphere with radial gradient
    ctx.save();
    
    // Calculate ball radius based on power-up
    const currentRadius = activePowerUps.doubleSize ? ball.radius * 2 : ball.radius;
    
    // If the ball has fire effect
    if (activePowerUps.fireBall) {
        // Calculate blinking if less than 3 seconds remaining
        let alpha = 1.0;
        if (powerUpTimers.fireBall <= 3.0) {
            alpha = 0.3 + 0.7 * Math.abs(Math.sin(powerUpTimers.fireBall * Math.PI * 2));
        }
        
        // Fire gradient
        const grad = ctx.createRadialGradient(
            ball.x - currentRadius/3, 
            ball.y - currentRadius/3, 
            currentRadius/4, 
            ball.x, 
            ball.y, 
            currentRadius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.3, `rgba(255, 165, 0, ${alpha})`);
        grad.addColorStop(0.7, `rgba(255, 69, 0, ${alpha})`);
        grad.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);
        
        // Draw ball with fire gradient
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = `rgba(255, 69, 0, ${alpha * 0.5})`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Normal ball
        const grad = ctx.createRadialGradient(
            ball.x - currentRadius/3, 
            ball.y - currentRadius/3, 
            currentRadius/4, 
            ball.x, 
            ball.y, 
            currentRadius
        );
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#e0e0e0');
        grad.addColorStop(1, '#a0a0a0');
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
    
    ctx.restore();
}

function drawPaddle() {
    // Paddle with rounded tips and new blue design
    ctx.save();
    if (isPaddleDestroyed && Math.floor(paddleDestructionFrames / 4) % 2 === 0) {
        ctx.globalAlpha = 0.2;
    }
    
    // Create gradient for the paddle (blue)
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#1976d2'); // Azul oscuro
    gradient.addColorStop(1, '#64b5f6'); // Azul claro
    
    // Draw the paddle with rounded tips
    ctx.beginPath();
    const radius = paddle.height / 2;
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    
    // Fill with blue gradient
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add blue border
    ctx.strokeStyle = '#b3e5fc';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// Add at the top with other game variables
let currentAnimatedBlock = null;
let animationTimer = 0;

// Constantes de animación
const MIN_ANIMATION_DURATION = 300;
const MAX_ANIMATION_DURATION = 800; // Base duration, will be adjusted by audio
const BLOCK_CHANGE_INTERVAL = 1000; // Tiempo entre cambios de bloques animados
const MAX_ANIMATED_BLOCKS_PERCENTAGE = 0.2; // 20% del total de bloques activos

// Add at the top with other game variables
let animatedBlocks = []; // Array para mantener múltiples bloques animados
const FREQUENCY_BANDS = 8; // Número de bandas de frecuencia a analizar
const PEAK_THRESHOLD = 0.2; // Reducido el umbral para detectar más picos
const PEAK_COOLDOWN = 50; // Reducido el tiempo entre picos

// Constantes para detección de percusión
const DRUM_FREQ_START = 0.1; // 10% del espectro (frecuencias bajas)
const DRUM_FREQ_END = 0.3;   // 30% del espectro (frecuencias medias-bajas)
const DRUM_THRESHOLD = 0.4;  // Umbral para detectar golpes de percusión
const DRUM_DECAY = 0.95;     // Factor de decaimiento para suavizar la detección

// Variables para detección de percusión
let lastDrumIntensity = 0;
let drumHistory = new Array(5).fill(0); // Historial de los últimos 5 frames

// Variables para detección de picos
let lastPeakTime = 0;
let previousFrequencies = new Array(FREQUENCY_BANDS).fill(0);
let peakHistory = new Array(FREQUENCY_BANDS).fill(0);
let averageIntensity = 0;
let debugCounter = 0; // Para no saturar la consola

function detectPeaks(frequencyData) {
    const now = Date.now();
    const peaks = [];
    
    // Calcular la intensidad promedio de todas las bandas
    const totalIntensity = frequencyData.reduce((sum, val) => sum + val, 0);
    averageIntensity = totalIntensity / FREQUENCY_BANDS;
    
    // Solo detectar picos si ha pasado suficiente tiempo desde el último
    if (now - lastPeakTime < PEAK_COOLDOWN) {
        return peaks;
    }
    
    // Encontrar las bandas con mayor intensidad
    let maxIntensities = [];
    for (let i = 0; i < FREQUENCY_BANDS; i++) {
        maxIntensities.push({
            band: i,
            intensity: frequencyData[i]
        });
    }
    
    // Ordenar por intensidad
    maxIntensities.sort((a, b) => b.intensity - a.intensity);
    
    // Log cada 15 frames para ver más información
    if (debugCounter++ % 15 === 0) {
        console.debug(`Audio Analysis at ${backgroundMusic.currentTime.toFixed(2)}s:`, {
            topBands: maxIntensities.slice(0, 3).map(b => `Band ${b.band}: ${b.intensity.toFixed(2)}`),
            average: averageIntensity.toFixed(2),
            isPlaying: !backgroundMusic.paused,
            volume: backgroundMusic.volume
        });
    }
    
    // Detectar picos en las bandas más intensas
    for (let i = 0; i < 3; i++) {
        const band = maxIntensities[i];
        if (band.intensity > averageIntensity * 1.2 && band.intensity > PEAK_THRESHOLD) {
            peaks.push(band.band);
            console.debug(`Peak detected at ${backgroundMusic.currentTime.toFixed(2)}s! Band: ${band.band}, Intensity: ${band.intensity.toFixed(2)}`);
        }
    }
    
    if (peaks.length > 0) {
        lastPeakTime = now;
    }
    
    return peaks;
}

function drawBricks() {
    // First draw a slightly lighter background for the game area
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(gameBorder.left, gameBorder.top, gameBorder.right - gameBorder.left, gameBorder.bottom - gameBorder.top);
    
    // Update animation timer
    const now = Date.now();
    
    // Clear blocks that have finished their animation
    animatedBlocks = animatedBlocks.filter(block => now - block.timer < block.duration);
    
    // Count active blocks
    let activeBlocksCount = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1 || bricks[c][r].indestructible) {
                activeBlocksCount++;
            }
        }
    }
    
    // Calculate maximum animated blocks (20% of total)
    const maxAnimatedBlocks = Math.max(1, Math.floor(activeBlocksCount * MAX_ANIMATED_BLOCKS_PERCENTAGE));
    
    // Get audio data if available
    let audioIntensity = 0.5; // Default value
    let maxAudioIntensity = 0.5; // For adjusting maximum duration
    let peakIntensity = 0.5; // For glow effect
    let drumIntensity = 0.5; // For percussion
    
    if (analyser && dataArray && !backgroundMusic.paused) {
        try {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average audio intensity
            const sum = dataArray.reduce((a, b) => a + b, 0);
            audioIntensity = Math.min(1, Math.max(0.3, sum / (dataArray.length * 128)));
            
            // Calculate maximum intensity for duration adjustment
            const maxValue = Math.max(...dataArray);
            maxAudioIntensity = Math.min(1, Math.max(0.3, maxValue / 255));
            
            // Detect percussion in mid-low frequencies
            const drumStart = Math.floor(dataArray.length * DRUM_FREQ_START);
            const drumEnd = Math.floor(dataArray.length * DRUM_FREQ_END);
            const drumFreqs = dataArray.slice(drumStart, drumEnd);
            
            // Calculate percussion energy
            const drumEnergy = drumFreqs.reduce((a, b) => a + b, 0) / (drumEnd - drumStart);
            const normalizedDrumEnergy = drumEnergy / 128;
            
            // Update percussion history
            drumHistory.push(normalizedDrumEnergy);
            drumHistory.shift();
            
            // Calculate difference with previous frame
            const drumDiff = normalizedDrumEnergy - lastDrumIntensity;
            
            // Detect percussion peaks
            if (drumDiff > DRUM_THRESHOLD && normalizedDrumEnergy > 0.3) {
                drumIntensity = Math.min(1, drumDiff * 2);
            } else {
                drumIntensity = Math.max(0.3, drumIntensity * DRUM_DECAY);
            }
            
            lastDrumIntensity = normalizedDrumEnergy;
            
            // Calculate peak intensity for glow effect
            const highFreqSum = dataArray.slice(-dataArray.length/4).reduce((a, b) => a + b, 0);
            peakIntensity = Math.min(1, Math.max(0.3, highFreqSum / (dataArray.length/4 * 128)));
            
            // Combine percussion intensity with general intensity
            audioIntensity = Math.max(audioIntensity, drumIntensity);
            
        } catch (error) {
            console.debug("Error getting audio data:", error);
        }
    }
    
    // Adjust maximum duration based on audio intensity
    const currentMaxDuration = MIN_ANIMATION_DURATION + (MAX_ANIMATION_DURATION - MIN_ANIMATION_DURATION) * maxAudioIntensity;
    
    // Select new blocks to animate if needed
    if (animatedBlocks.length < maxAnimatedBlocks && now - animationTimer > BLOCK_CHANGE_INTERVAL) {
        // Find all active blocks that are not being animated
        const activeBlocks = [];
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r].status === 1 || bricks[c][r].indestructible) {
                    // Verify block is not already being animated
                    if (!animatedBlocks.some(block => block.c === c && block.r === r)) {
                        activeBlocks.push({c, r});
                    }
                }
            }
        }
        
        // Select random blocks until reaching maximum
        while (animatedBlocks.length < maxAnimatedBlocks && activeBlocks.length > 0) {
            const randomIndex = Math.floor(Math.random() * activeBlocks.length);
            const randomBlock = activeBlocks[randomIndex];
            
            // Calculate animation duration based on audio and percussion intensity
            const duration = MIN_ANIMATION_DURATION + (currentMaxDuration - MIN_ANIMATION_DURATION) * audioIntensity;
            
            animatedBlocks.push({
                c: randomBlock.c,
                r: randomBlock.r,
                timer: now,
                duration: duration,
                intensity: Math.max(audioIntensity, drumIntensity) // Use highest intensity
            });
            
            // Remove selected block to avoid repetition
            activeBlocks.splice(randomIndex, 1);
        }
        
        animationTimer = now;
    }
    
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1 || b.indestructible) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                
                // Determine block color based on type
                let mainColor;
                if (b.indestructible) {
                    mainColor = '#00ffff'; // Cyan for indestructible
                } else if (b.hits === 2) {
                    mainColor = '#ff0000'; // Red for double-hit blocks
                } else {
                    // Colors according to the type of block
                    switch(b.color) {
                        case 'W': mainColor = '#f5f5f5'; break; // White
                        case 'Y': mainColor = '#ffd600'; break; // Yellow
                        case 'R': mainColor = '#f44336'; break; // Red
                        case 'G': mainColor = '#4caf50'; break; // Green
                        case 'O': mainColor = '#ff9800'; break; // Orange
                        case 'P': mainColor = '#9c27b0'; break; // Purple
                        case '2': mainColor = '#888'; break; // Gray
                        case '#': mainColor = '#00bcd4'; break; // Blue
                        default: mainColor = '#f5f5f5'; // White (default)
                    }
                }
                
                // Check if this block is being animated
                const animatedBlock = animatedBlocks.find(block => block.c === c && block.r === r);
                if (animatedBlock) {
                    // Calculate animation progress (0 to 1)
                    const progress = (now - animatedBlock.timer) / animatedBlock.duration;
                    if (progress < 1) {
                        // Usar una curva más dramática para la interpolación
                        const t = Math.sin(progress * Math.PI);
                        
                        // Interpolar entre el color original y blanco puro
                        const r1 = parseInt(mainColor.slice(1,3), 16);
                        const g1 = parseInt(mainColor.slice(3,5), 16);
                        const b1 = parseInt(mainColor.slice(5,7), 16);
                        
                        // Hacer la transición más dramática y ajustar por intensidad
                        const intensity = animatedBlock.intensity;
                        const r = Math.round(r1 + (255 - r1) * t * t * intensity);
                        const g = Math.round(g1 + (255 - g1) * t * t * intensity);
                        const b = Math.round(b1 + (255 - b1) * t * t * intensity);
                        
                        mainColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
                        
                        // Efecto de brillo más intenso, ajustado por la intensidad de los picos
                        ctx.shadowColor = '#ffffff';
                        // El resplandor varía entre 10 y 40 según la intensidad de los picos
                        ctx.shadowBlur = 10 + (30 * peakIntensity * t);
                    }
                }
                
                // Create gradient for the block with more contrast
                const gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                gradient.addColorStop(0, shadeColor(mainColor, 40));
                gradient.addColorStop(1, shadeColor(mainColor, -40));
                
                // Draw block with gradient
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fill();
                
                // Draw border normal
                ctx.strokeStyle = shadeColor(mainColor, -50);
                ctx.lineWidth = 2;
                ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }
        }
    }
    
    // Draw the fading blocks
    drawFadingBlocks();
}

// Function to create an explosion when a brick is destroyed
function createBrickExplosion(brick) {
    // Color according to type
    let color;
    if (brick.hits === 2) {
        color = '#888';
    } else {
        color = '#fff';
    }
    
    // We no longer use particle explosions
    // Instead, we add a fading block
    fadeOutBlocks.push({
        x: brick.x,
        y: brick.y,
        width: brickWidth,
        height: brickHeight,
        color: color,
        time: 1.0, // Initial life time (1.0 = 100%)
        originalWidth: brickWidth,
        originalHeight: brickHeight
    });
}

// Function to draw the fading blocks
function drawFadingBlocks() {
    for (let i = fadeOutBlocks.length - 1; i >= 0; i--) {
        const block = fadeOutBlocks[i];
        
        // Update life time (slower than before)
        block.time -= 0.015; // Slower reduction to make it last longer
        
        if (block.time <= 0) {
            fadeOutBlocks.splice(i, 1);
            continue;
        }
        
        // Calculate new size (shrinks gradually)
        const scaleFactor = 0.3 + block.time * 0.7; // Starts at 1.0 and reduces to 30% before disappearing
        const newWidth = block.originalWidth * scaleFactor;
        const newHeight = block.originalHeight * scaleFactor;
        
        // Calculate central position to animate from the center
        const centerX = block.x + block.originalWidth / 2;
        const centerY = block.y + block.originalHeight / 2;
        
        // Calculate new position keeping the center
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;
        
        // Draw block with fading and size reduction
        ctx.save();
        ctx.globalAlpha = block.time; // Alpha reduces from 1.0 to 0
        
        // Main color of the block
        ctx.fillStyle = block.color;
        ctx.beginPath();
        ctx.rect(newX, newY, newWidth, newHeight);
        ctx.fill();
        
        // Reduced 3D effects in size
        // Create gradient for the fading block
        const gradientColor = shadeColor(block.color, 20);
        const gradient = ctx.createLinearGradient(newX, newY, newX, newY + newHeight);
        gradient.addColorStop(0, gradientColor);
        gradient.addColorStop(1, block.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.rect(newX, newY, newWidth, newHeight);
        ctx.fill();
        
        // Simple border
        ctx.strokeStyle = shadeColor(block.color, -30);
        ctx.lineWidth = 1 * scaleFactor;
        ctx.strokeRect(newX, newY, newWidth, newHeight);
        
        ctx.restore();
    }
}

function drawScore() {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, gameBorder.right + 15, gameBorder.top + 30);
}

function drawLives() {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#0095DD';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${lives}`, gameBorder.right + 15, gameBorder.top + 55);
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            for (let ball of balls) {
                if ((b.status === 1 || b.indestructible) && ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    // Si la bola tiene el efecto de fuego
                    if (activePowerUps.fireBall) {
                        // Destruir cualquier tipo de bloque
                        b.status = 0;
                        b.indestructible = false;
                        score++;
                        audioBrick.currentTime = 0; 
                        audioBrick.play();
                        createBrickExplosion(b);
                        spawnPowerUp(b.x + brickWidth / 2 - 14, b.y + brickHeight / 2 - 14);
                    } else if (!b.indestructible) {
                        // --- IMPROVED REALISTIC COLLISION PHYSICS ---
                        // Calculate the impact point relative to the center of the block
                        const blockCenterX = b.x + brickWidth / 2;
                        const blockCenterY = b.y + brickHeight / 2;
                        const impactX = ball.x - blockCenterX;
                        const impactY = ball.y - blockCenterY;
                        
                        // Calculate the previous position of the ball
                        const prevX = ball.x - ball.dx;
                        const prevY = ball.y - ball.dy;
                        
                        // Determine the impact side based on the trajectory
                        let hitSide = '';
                        
                        // Calculate the distances to each edge
                        const distToLeft = Math.abs(prevX - b.x);
                        const distToRight = Math.abs(prevX - (b.x + brickWidth));
                        const distToTop = Math.abs(prevY - b.y);
                        const distToBottom = Math.abs(prevY - (b.y + brickHeight));
                        
                        // Find the nearest edge
                        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                        
                        if (minDist === distToLeft) hitSide = 'left';
                        else if (minDist === distToRight) hitSide = 'right';
                        else if (minDist === distToTop) hitSide = 'top';
                        else hitSide = 'bottom';
                        
                        // Apply bounce according to the impact side
                        switch(hitSide) {
                            case 'left':
                            case 'right':
                                ball.dx = -ball.dx;
                                // Adjust position to avoid multiple collisions
                                ball.x = hitSide === 'left' ? b.x - ball.radius : b.x + brickWidth + ball.radius;
                                break;
                            case 'top':
                            case 'bottom':
                                ball.dy = -ball.dy;
                                // Adjust position to avoid multiple collisions
                                ball.y = hitSide === 'top' ? b.y - ball.radius : b.y + brickHeight + ball.radius;
                                break;
                        }
                        
                        // Apply a small "spin" effect based on the impact point
                        const spinFactor = 0.15; // Aumentado para más efecto
                        if (hitSide === 'left' || hitSide === 'right') {
                            ball.dy += impactY * spinFactor;
                        } else {
                            ball.dx += impactX * spinFactor;
                        }
                        
                        // Normalize the speed to maintain a constant speed
                        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        const speedFactor = ball.baseSpeed / currentSpeed;
                        ball.dx *= speedFactor;
                        ball.dy *= speedFactor;

                        if (b.indestructible) {
                            // Play metal sound for indestructible blocks
                            audioMetalClick.currentTime = 0; 
                            audioMetalClick.play();
                        } else {
                            // For all destructible blocks
                            b.status = 0;
                            score++;
                            audioBrick.currentTime = 0; 
                            audioBrick.play();
                            // Create fading effect
                            createBrickExplosion(b);
                            // Power-up: possibility of dropping one
                            spawnPowerUp(b.x + brickWidth / 2 - 14, b.y + brickHeight / 2 - 14);
                        }
                    }
                    
                    // Check if all destructible bricks have been destroyed
                    const destructiblesRestantes = bricks.flat().filter(b => !b.indestructible && b.status === 1).length;
                    if (destructiblesRestantes === 0 && !showLevelMessage) {
                        showLevelMessage = true;
                        if (transitionTimeout) clearTimeout(transitionTimeout);
                        transitionTimeout = setTimeout(() => {
                            showLevelMessage = false;
                            currentLevel++;
                            if (currentLevel < levels.length) {
                                console.debug("Level completed. Advancing to level " + currentLevel);
                                loadLevel(currentLevel);
                                draw();
                            } else {
                                // Game over - Victory
                                showGameOver = true;
                                if (transitionTimeout) clearTimeout(transitionTimeout);
                                transitionTimeout = setTimeout(() => {
                                    showGameOver = false;
                                    returnToMenu();
                                }, 5000);
                            }
                        }, 1500);
                    }
                    
                    // Important: exit the loop after a collision to avoid multiple collisions
                    return;
                }
            }
        }
    }
}

function resetBalls() {
    // If there are no balls, create a new one
    if (balls.length === 0) {
        balls.push(createBall());
    } else {
        // Reset the position of all existing balls
        for (let ball of balls) {
            const newBall = createBall();
            ball.x = newBall.x;
            ball.y = newBall.y;
            ball.dx = newBall.dx;
            ball.dy = newBall.dy;
            ball.baseSpeed = newBall.baseSpeed;
        }
    }
}

function launchBall() {
    if (waitingToLaunch) {
        waitingToLaunch = false;
        if (launchTimeout) clearTimeout(launchTimeout);
        
        // Launch all available balls
        for (let ball of balls) {
            // Posicionar la bola sobre el paddle
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius;
            
            // Lanzar la bola usando el mismo ángulo que en createBall
            const angle = 0.6;
            ball.dx = ball.baseSpeed * Math.cos(angle);
            ball.dy = -ball.baseSpeed * Math.sin(angle);
            
            // Verificar que la velocidad resultante sea exactamente baseSpeed
            const actualSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            console.debug(`Ball launched with speed: ${actualSpeed.toFixed(2)} (target: ${ball.baseSpeed})`);
        }
        
        console.debug("Balls launched with base speed of", balls[0].baseSpeed);
    }
}

function drawPause() {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = '48px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press P to continue', canvas.width / 2, canvas.height / 2 + 50);
    ctx.restore();
}

function drawPowerUpBars() {
    // Visual indicators of power-up duration with fade in/out
    const barW = 150, barH = 10, gap = 8; // Reduced size and spacing
    // Positioning in the side panel
    let x = gameBorder.right + 15;
    let y = gameBorder.top + 80; // Adjusted start
    
    ctx.save();
    ctx.font = '12px Arial'; // Smaller font
    
    // Array to store all active power-ups
    const activeBars = [];
    
    // Add to the array only the active power-ups or those that are fading
    if (activePowerUps.sizeStack !== 0 || powerUpBarAlpha.sizeStack > 0.01) {
        activeBars.push({
            type: 'Size',
            timer: powerUpTimers.sizeStack,
            alpha: powerUpBarAlpha.sizeStack,
            color: '#2196f3',
            active: activePowerUps.sizeStack !== 0
        });
    }
    
    if (activePowerUps.speedStack !== 0 || powerUpBarAlpha.speedStack > 0.01) {
        activeBars.push({
            type: 'Speed',
            timer: powerUpTimers.speedStack,
            alpha: powerUpBarAlpha.speedStack,
            color: '#ff9800',
            active: activePowerUps.speedStack !== 0
        });
    }
    
    if (activePowerUps.invincible || powerUpBarAlpha.invincible > 0.01) {
        activeBars.push({
            type: 'Barrier',
            timer: powerUpTimers.invincible,
            alpha: powerUpBarAlpha.invincible,
            color: '#4caf50',
            active: activePowerUps.invincible
        });
    }
    
    if (activePowerUps.fireBall || powerUpBarAlpha.fireBall > 0.01) {
        activeBars.push({
            type: 'Fire',
            timer: powerUpTimers.fireBall,
            alpha: powerUpBarAlpha.fireBall,
            color: '#ff4500',
            active: activePowerUps.fireBall
        });
    }
    
    if (activePowerUps.doubleSize || powerUpBarAlpha.doubleSize > 0.01) {
        activeBars.push({
            type: 'Double',
            timer: powerUpTimers.doubleSize,
            alpha: powerUpBarAlpha.doubleSize,
            color: '#9c27b0',
            active: activePowerUps.doubleSize
        });
    }
    
    // Draw from the top down
    for (let i = 0; i < activeBars.length; i++) {
        const bar = activeBars[i];
        
        // Update alpha (fade in/out)
        if (bar.active && bar.alpha < 1) {
            bar.alpha += 0.05;
            if (bar.alpha > 1) bar.alpha = 1;
            
            // Update the alpha in the original object
            if (bar.type === 'Size') powerUpBarAlpha.sizeStack = bar.alpha;
            else if (bar.type === 'Speed') powerUpBarAlpha.speedStack = bar.alpha;
            else if (bar.type === 'Barrier') powerUpBarAlpha.invincible = bar.alpha;
            else if (bar.type === 'Fire') powerUpBarAlpha.fireBall = bar.alpha;
            else if (bar.type === 'Double') powerUpBarAlpha.doubleSize = bar.alpha;
        } else if (!bar.active && bar.alpha > 0) {
            bar.alpha -= 0.05;
            if (bar.alpha < 0) bar.alpha = 0;
            
            // Update the alpha in the original object
            if (bar.type === 'Size') powerUpBarAlpha.sizeStack = bar.alpha;
            else if (bar.type === 'Speed') powerUpBarAlpha.speedStack = bar.alpha;
            else if (bar.type === 'Barrier') powerUpBarAlpha.invincible = bar.alpha;
            else if (bar.type === 'Fire') powerUpBarAlpha.fireBall = bar.alpha;
            else if (bar.type === 'Double') powerUpBarAlpha.doubleSize = bar.alpha;
        }
        
        // Y position (from top to bottom)
        const barY = y + (i * (barH + gap));
        
        ctx.globalAlpha = bar.alpha;
        ctx.fillStyle = bar.color;
        
        // Calculating the maximum duration depending on the type
        let maxDuration = POWERUP_DURATION;
        if (bar.type === 'Barrier') maxDuration = INVINCIBLE_DURATION;
        else if (bar.type === 'Double') maxDuration = DOUBLE_SIZE_DURATION;
        
        ctx.fillRect(x, barY, barW * (bar.timer / maxDuration), barH);
        ctx.strokeStyle = '#222';
        ctx.strokeRect(x, barY, barW, barH);
        ctx.fillStyle = '#fff';
        ctx.fillText(bar.type, x + 5, barY + barH - 2);
    }
    
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Function for the bounce on walls with the new borders
function handleWallCollisions() {
    for (let ball of balls) {
        // Bounce on lateral walls (now with border)
        if (ball.x + ball.dx > gameBorder.right - ball.radius || ball.x + ball.dx < gameBorder.left + ball.radius) {
            ball.dx = -ball.dx;
            audioBounce.currentTime = 0; 
            audioBounce.play();
        }
        
        // Bounce on the ceiling (now with border)
        if (ball.y + ball.dy < gameBorder.top + borderThickness + ball.radius) {
            ball.dy = -ball.dy;
            audioBounce.currentTime = 0; 
            audioBounce.play();
        }
        
        // Bounce on the floor when the invincible power-up is active
        if (activePowerUps.invincible && ball.y + ball.dy > canvas.height - borderThickness - ball.radius) {
            ball.dy = -ball.dy;
            audioBounce.currentTime = 0;
            audioBounce.play();
        }
        
        // Prevent ball from entering the side panel
        if (ball.x + ball.dx > gameBorder.right - ball.radius) {
            ball.x = gameBorder.right - ball.radius;
            ball.dx = -ball.dx;
            audioBounce.currentTime = 0;
            audioBounce.play();
        }
    }
}

function requestFullscreen() {
    if (canvas.requestFullscreen) canvas.requestFullscreen();
    else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    else if (canvas.mozRequestFullScreen) canvas.mozRequestFullScreen();
    else if (canvas.msRequestFullscreen) canvas.msRequestFullscreen();
    
    // After the change, make sure to resize
    setTimeout(adjustCanvas, 100);
}

// Keyboard events for global controls
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (!menuActive && !paused) {
            // We are in the game, return to the menu
            console.debug("ESC pressed during the game. Returning to the menu...");
            returnToMenu();
        } else if (menuActive) {
            // We are in the menu, try to close the window
            console.debug("ESC pressed in the menu. Trying to close window...");
            if (typeof window.close === 'function') window.close();
        }
    } else if (!menuActive && (e.key === 'p' || e.key === 'P' || e.code === 'Pause')) {
        // Pause - only works during the game
        paused = !paused;
        console.debug("Pause toggled:", paused);
        if (!paused) {
            // If unpaused, ensure loop continues
            if (!gameLoopId) {
                lastFrameTime = performance.now();
                gameLoopId = requestAnimationFrame(draw);
            }
        }
    } else if (waitingToLaunch && (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'Up')) {
        // Manual ball launch - only works during the game
        launchBall();
    } else if (!menuActive && e.key === '+') {
        // Advance to next level
        if (currentLevel < levels.length - 1) {
            currentLevel++;
            loadLevel(currentLevel);
        } else {
            // If we're on the last level, end the game
            showGameOver = true;
            gameOverHandled = false;
        }
    } else if (!menuActive && e.key === '-') {
        // Go back to previous level
        if (currentLevel > 0) {
            currentLevel--;
            loadLevel(currentLevel);
        } else {
            // If we're on the first level, return to menu
            returnToMenu();
        }
    } else if (!menuActive && e.key === '*') {
        // Restart current level
        loadLevel(currentLevel);
    }
});

// Initialize and start playing music
initBackgroundMusic();

// Set the initial state as menu
menuActive = true;

// Iniciar animación del menú
if (menuLoopId) {
    cancelAnimationFrame(menuLoopId);
}
menuLoopId = requestAnimationFrame(menuLoop);

console.debug("Game initialized. Initial state: menuActive=", menuActive, "menuLoopId=", menuLoopId);

// Function to reset all speeds and effects of the game
function resetGameSpeeds() {
    // Reset active speeds and effects
    activePowerUps = {
        sizeStack: 0,
        speedStack: 0,
        invincible: false,
        fireBall: false,
        doubleSize: false
    };
    powerUpTimers = {
        sizeStack: 0,
        speedStack: 0,
        invincible: 0,
        fireBall: 0,
        doubleSize: 0
    };
    
    // Reset paddle to normal size
    paddle.width = paddleOriginalWidth;
    paddle.height = paddleOriginalHeight;
    
    // Reset the music speed
    backgroundMusic.playbackRate = 1;
    
    // Reset all speeds to the initial value
    for (let ball of balls) {
        ball.dx = 1.8;
        ball.dy = -1.8;
        ball.baseSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    }
    
    // Reset the blinking of the bottom border
    bottomBorderBlink = false;
    bottomBorderAlpha = 1.0;
    
    // IMPORTANT: Make sure to set the original paddle speed
    paddle.speed = 4; // Original paddle speed
    
    // Reset power-up effects
    powerUps = [];
    brickExplosions = [];
    fadeOutBlocks = [];
    
    // Reset all timers and counters
    speedStackTimer = 0;
    
    console.debug('All speeds reset to default values. Paddle speed:', paddle.speed);
}

function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Gradient background for menu
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update animation variables
    titleHue = (titleHue + 1) % 360;
    titleY += 0.4 * titleDirection;
    if (Math.abs(titleY) > 8) {
        titleDirection *= -1;
    }
    titleScale = 1 + Math.sin(Date.now() / 500) * 0.05;
    titleAngle = Math.sin(Date.now() / 1000) * 0.05;
    
    // Draw animated title "BLIX"
    ctx.save();
    ctx.translate(canvas.width / 2, 100 + titleY);
    ctx.rotate(titleAngle);
    ctx.scale(titleScale, titleScale);
    
    // Shadow for the title
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Main text with gradient and border
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Create color gradient for the title
    const titleGradient = ctx.createLinearGradient(-100, -40, 100, 40);
    titleGradient.addColorStop(0, `hsl(${titleHue}, 100%, 60%)`);
    titleGradient.addColorStop(0.5, `hsl(${(titleHue + 60) % 360}, 100%, 60%)`);
    titleGradient.addColorStop(1, `hsl(${(titleHue + 120) % 360}, 100%, 60%)`);
    
    // Border of the text
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeText('BLIX', 0, 0);
    
    // Text with gradient
    ctx.fillStyle = titleGradient;
    ctx.fillText('BLIX', 0, 0);
    
    ctx.restore();
    
    ctx.font = '24px Arial';
    if (showControls) {
        ctx.fillStyle = '#fff';
        ctx.fillText('Controls:', canvas.width / 2, 200);
        ctx.font = '20px Arial';
        ctx.fillText('Arrow Keys ← → or Joystick: Move paddle', canvas.width / 2, 250);
        ctx.fillText('Enter: Select', canvas.width / 2, 280);
        ctx.fillText('Click: Enable sound', canvas.width / 2, 310);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.fillText('Press Enter to return', canvas.width / 2, 370);
        return;
    }
    // Function to draw the animated arrow
    const drawArrow = (x, y) => {
        // Animation values
        const arrowTime = Date.now() / 200;
        const arrowX = x - 20 + Math.sin(arrowTime) * 5; // Horizontal oscillation
        const arrowHue = (titleHue + 180) % 360; // Complementary color to the title
        
        // Draw the arrow
        ctx.save();
        ctx.fillStyle = `hsl(${arrowHue}, 100%, 60%)`;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        
        // Arrow with triangle shape
        ctx.beginPath();
        ctx.moveTo(arrowX, y);
        ctx.lineTo(arrowX - 15, y - 10);
        ctx.lineTo(arrowX - 15, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Brightness/glitter effect
        ctx.shadowColor = `hsl(${arrowHue}, 100%, 70%)`;
        ctx.shadowBlur = 10 + Math.sin(arrowTime * 2) * 5;
        ctx.fill();
        
        ctx.restore();
    };
    
    // Draw the menu options
    for (let i = 0; i < menuOptions.length; i++) {
        const y = 200 + i * 50; // Less vertical spacing
        const isSelected = i === selectedMenu;
        
        ctx.save();
        
        // Text of the option
        ctx.font = isSelected ? 'bold 28px Arial' : '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text color according to selection
        if (isSelected) {
            // Text with gradient for the selected option
            const optionGradient = ctx.createLinearGradient(
                canvas.width / 2 - 100, y, 
                canvas.width / 2 + 100, y
            );
            optionGradient.addColorStop(0, `hsl(${titleHue}, 100%, 80%)`);
            optionGradient.addColorStop(1, `hsl(${(titleHue + 60) % 360}, 100%, 80%)`);
            ctx.fillStyle = optionGradient;
            
            // Draw arrow to the left of the selected option
            drawArrow(canvas.width / 2 - 120, y);
        } else {
            // Unselected option: white text with subtle shadow
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 3;
        }
        
        // Draw the text of the option
        ctx.fillText(menuOptions[i], canvas.width / 2, y);
        
        ctx.restore();
    }
    // Instructions at the bottom with soft brightness effect
    ctx.save();
    ctx.font = '18px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 150, 255, 0.7)';
    ctx.shadowBlur = 3 + Math.sin(Date.now() / 500) * 2;
    ctx.fillText('Use ↑ ↓ and Enter to navigate', canvas.width / 2, 430);
    ctx.restore();
}

let lastFrameTime = performance.now();

function drawGameBorders() {
    ctx.save();
    
    // Draw game area border
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = borderThickness;
    ctx.strokeRect(
        gameBorder.left - borderThickness/2,
        gameBorder.top - borderThickness/2,
        gameBorder.right - gameBorder.left + borderThickness,
        gameBorder.bottom - gameBorder.top + borderThickness
    );
    
    // Draw barrier if active
    if (activePowerUps.invincible) {
        const alpha = powerUpTimers.invincible <= 3.0 ? 
            0.2 + 0.8 * Math.abs(Math.sin(powerUpTimers.invincible * Math.PI * 2)) : 1.0;
        
        ctx.strokeStyle = `rgba(76, 175, 80, ${alpha})`; // Green color with alpha
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.strokeRect(
            gameBorder.left,
            canvas.height - borderThickness - 2,
            gameBorder.right - gameBorder.left,
            0
        );
        ctx.setLineDash([]); // Reset line style
    }
    
    ctx.restore();
}

function draw() {
    // Check if we're in menu mode
    if (menuActive) {
        console.debug("WARNING: draw() called while menuActive=true. Canceling frame...");
        return;
    }
    
    // Calculate deltaTime in seconds
    const now = performance.now();
    let deltaTime = (now - lastFrameTime) / 1000;
    if (deltaTime > 0.1) deltaTime = 0.1; // Limit to 0.1s per frame
    lastFrameTime = now;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game state
    drawBricks();
    drawGameBorders(); // Add this line to draw borders
    for (let ball of balls) {
        drawBall(ball);
    }
    drawPaddle();
    drawScore();
    drawLives();
    drawPowerUps();
    drawPowerUpBars();
    
    if (paused) {
        // When paused, draw the pause message on top of the game state
        drawPause();
        gameLoopId = requestAnimationFrame(draw);
        return;
    }
    
    // Rest of the game logic (collisions, updates, etc.)
    if (showLevelMessage) {
        drawLevelMessage('Level Complete!');
        gameLoopId = requestAnimationFrame(draw);
        return;
    }
    if (showGameOver) {
        drawLevelMessage('GAME OVER');
        if (!gameOverHandled) {
            gameOverHandled = true;
            if (transitionTimeout) {
                clearTimeout(transitionTimeout);
                transitionTimeout = null;
            }
            if (launchTimeout) {
                clearTimeout(launchTimeout);
                launchTimeout = null;
            }
            
            transitionTimeout = setTimeout(() => {
                showGameOver = false;
                if (gameLoopId) {
                    cancelAnimationFrame(gameLoopId);
                    gameLoopId = null;
                }
                menuActive = true;
                currentLevel = 0;
                returnToMenu();
                gameOverHandled = false;
            }, 3000);
        }
        gameLoopId = requestAnimationFrame(draw);
        return;
    }
    if (waitingToLaunch) {
        // Allow paddle movement
        if (rightPressed && paddle.x < gameBorder.right - paddle.width) {
            paddle.speed = 4;
            paddle.x += paddle.speed;
        } else if (leftPressed && paddle.x > gameBorder.left) {
            paddle.speed = 4;
            paddle.x -= paddle.speed;
        }
        // Update ball position to follow paddle
        for (let ball of balls) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius;
        }
        gameLoopId = requestAnimationFrame(draw);
        return;
    }
    
    // Rest of the game logic...
    checkGamepad();
    collisionDetection();
    updatePowerUps();
    handleWallCollisions();
    
    // Verificar colisión con el paddle y rebote - FÍSICA MEJORADA
    for (let ball of balls) {
        // Calcular la posición siguiente de la bola
        const nextBallX = ball.x + ball.dx;
        const nextBallY = ball.y + ball.dy;

        // Verificamos si la bola va a cruzar la línea superior del paddle
        if (ball.y + ball.radius <= paddle.y && nextBallY + ball.radius >= paddle.y) {
            // Verificar si está horizontalmente dentro del paddle
            if (nextBallX + ball.radius > paddle.x && nextBallX - ball.radius < paddle.x + paddle.width) {
                // Calcular el punto exacto de colisión en Y
                ball.y = paddle.y - ball.radius;
                
                // 1. Calcular la posición relativa de impacto (0 a 1)
                const relativeIntersectX = (ball.x - paddle.x) / paddle.width;
                
                // 2. Calcular la velocidad del paddle en el momento del impacto
                const paddleSpeed = rightPressed ? paddle.speed : (leftPressed ? -paddle.speed : 0);
                
                // 3. Calcular el ángulo base de rebote (más pronunciado en los extremos)
                // Usar una función no lineal para hacer más pronunciados los ángulos en los extremos
                const normalizedPosition = relativeIntersectX * 2 - 1; // Convertir a rango -1 a 1
                const angleFactor = Math.sign(normalizedPosition) * Math.pow(Math.abs(normalizedPosition), 1.5);
                const maxBounceAngle = Math.PI / 3; // 60 grados máximo
                const bounceAngle = angleFactor * maxBounceAngle;
                
                // 4. Calcular la velocidad actual de la bola
                const currentSpeed = ball.baseSpeed; // Usar la velocidad base en lugar de la actual
                
                // 5. Aplicar efecto de "spin" basado en la velocidad del paddle
                const spinFactor = 0.2; // Factor de influencia del spin
                const spinEffect = paddleSpeed * spinFactor;
                
                // 6. Calcular la nueva velocidad (usando la velocidad base)
                const newSpeed = currentSpeed;
                
                // 7. Aplicar el ángulo y la velocidad
                ball.dx = newSpeed * Math.sin(bounceAngle) + spinEffect;
                ball.dy = -Math.abs(newSpeed * Math.cos(bounceAngle)); // Siempre hacia arriba
                
                // 8. Asegurar que la velocidad no sea demasiado baja
                const minSpeed = ball.baseSpeed * 0.8;
                const actualSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                if (actualSpeed < minSpeed) {
                    const speedFactor = minSpeed / actualSpeed;
                    ball.dx *= speedFactor;
                    ball.dy *= speedFactor;
                }
                
                // 9. Limitar la velocidad máxima
                const maxSpeed = ball.baseSpeed * 1.2; // Reducido de 2.5 a 1.2 para mantener la velocidad más constante
                if (actualSpeed > maxSpeed) {
                    const speedFactor = maxSpeed / actualSpeed;
                    ball.dx *= speedFactor;
                    ball.dy *= speedFactor;
                }
                
                // Reproducir sonido de rebote
                audioBounce.currentTime = 0;
                audioBounce.play();
            }
        }

        // Verificar si la bola ha caído
        if (ball.y + ball.radius > canvas.height) {
            // Si no está activo el power-up invincible
            if (!activePowerUps.invincible) {
                // Eliminar la pelota actual
                const ballIndex = balls.indexOf(ball);
                if (ballIndex > -1) {
                    balls.splice(ballIndex, 1);
                }
                
                // Si no quedan pelotas, perder una vida
                if (balls.length === 0) {
                    // ANIMACIÓN DE DESTRUCCIÓN DEL PADDLE
                    if (!isPaddleDestroyed) {
                        isPaddleDestroyed = true;
                        paddleDestructionFrames = 0;
                    }
                }
            }
        }

        // Movimiento de la bola
        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    // Animación de destrucción del paddle
    if (isPaddleDestroyed) {
        paddleDestructionFrames++;
        if (paddleDestructionFrames > 24) { // 24 frames de animación (~0.4s a 60fps)
            isPaddleDestroyed = false;
            paddleDestructionFrames = 0;
            // Restar vida y reiniciar bola y paddle
            lives--;
            if (lives <= 0) {
                showGameOver = true;
                // Asegurarnos de que el temporizador de game over no esté activo
                if (transitionTimeout) clearTimeout(transitionTimeout);
                gameOverHandled = false; // Reset para que se maneje correctamente
            } else {
                paddle.x = (canvas.width - paddle.width) / 2;
                paddle.width = paddleOriginalWidth;
                paddle.height = paddleOriginalHeight;
                resetBalls();
                waitingToLaunch = true;
                if (launchTimeout) clearTimeout(launchTimeout);
                launchTimeout = setTimeout(() => {
                    launchBall();
                }, 3000);
                backgroundMusic.playbackRate = 1; // Restaurar velocidad normal de la música
                activePowerUps = {
                    sizeStack: 0,
                    speedStack: 0,
                    invincible: false,
                    fireBall: false
                };
                speedStackTimer = 0;
                powerUps = [];
            }
        }
    } else {
        // Movimiento del paddle
        if (rightPressed && paddle.x < gameBorder.right - paddle.width) {
            paddle.speed = 4;
            paddle.x += paddle.speed;
        } else if (leftPressed && paddle.x > gameBorder.left) {
            paddle.speed = 4;
            paddle.x -= paddle.speed;
        }
    }

    // --- NUEVO: temporizador de power-ups ---
    if (activePowerUps.sizeStack !== 0) {
        powerUpTimers.sizeStack -= deltaTime;
        if (powerUpTimers.sizeStack <= 0) {
            activePowerUps.sizeStack = 0;
            applyStackedPowerUps();
        }
    }
    if (activePowerUps.speedStack !== 0) {
        powerUpTimers.speedStack -= deltaTime;
        if (powerUpTimers.speedStack <= 0) {
            activePowerUps.speedStack = 0;
            applyStackedPowerUps();
        }
    }
    if (activePowerUps.invincible) {
        powerUpTimers.invincible -= deltaTime;
        
        // Blinking when 3 seconds or less remaining
        if (powerUpTimers.invincible <= 3.0) {
            // Blink the border with a cycle of approximately 0.5 seconds
            powerUpBarAlpha.invincible = 0.2 + 0.8 * Math.abs(Math.sin(powerUpTimers.invincible * Math.PI * 2));
        }
        
        if (powerUpTimers.invincible <= 0) {
            activePowerUps.invincible = false;
            powerUpBarAlpha.invincible = 0;
        }
    }
    if (activePowerUps.fireBall) {
        powerUpTimers.fireBall -= deltaTime;
        
        // Parpadeo cuando quedan 3 segundos o menos
        if (powerUpTimers.fireBall <= 3.0) {
            bottomBorderBlink = true;
            // Hacer parpadear el borde con un ciclo de aproximadamente 0.5 segundos
            bottomBorderAlpha = 0.2 + 0.8 * Math.abs(Math.sin(powerUpTimers.fireBall * Math.PI * 2));
        }
        
        if (powerUpTimers.fireBall <= 0) {
            activePowerUps.fireBall = false;
            bottomBorderBlink = false;
        }
    }

    // En el loop principal, incrementar el ángulo de rotación de los power-ups
    powerUpAngle += 0.05;

    // In the main game loop, add the double size timer check
    if (activePowerUps.doubleSize) {
        powerUpTimers.doubleSize -= deltaTime;
        
        // Blinking when 3 seconds or less remaining
        if (powerUpTimers.doubleSize <= 3.0) {
            bottomBorderBlink = true;
            // Blink the border with a cycle of approximately 0.5 seconds
            bottomBorderAlpha = 0.2 + 0.8 * Math.abs(Math.sin(powerUpTimers.doubleSize * Math.PI * 2));
        }
        
        if (powerUpTimers.doubleSize <= 0) {
            activePowerUps.doubleSize = false;
            bottomBorderBlink = false;
        }
    }

    gameLoopId = requestAnimationFrame(draw);
}

// Función del loop del menú con animación
function menuLoop() {
    drawMenu();
    requestAnimationFrame(menuLoop);
}

function startGame() {
    console.debug("Starting startGame(). Initial state:", {
        menuActive,
        menuLoopId,
        gameLoopId,
        currentLevel
    });
    
    // 1. SETUP EVENTS AND STATE
    setupGameEvents();
    resetGameState();
    
    // 2. Ensure we start from level 1
    currentLevel = 0;
    
    // 3. LOAD CURRENT LEVEL
    loadLevel(currentLevel);
    
    // 4. REMOVE MENU EVENT LISTENER
    document.removeEventListener('keydown', menuKeyDownHandler);
    
    // 5. ADD GAME EVENT LISTENERS
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    // 6. DISABLE MENU AND START GAME LOOP
    menuActive = false;
    lastFrameTime = performance.now();
    if (gameLoopId) {
        console.debug("Canceling existing gameLoopId:", gameLoopId);
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    gameLoopId = requestAnimationFrame(draw);
    
    console.debug("Game started. Final state:", {
        menuActive,
        gameLoopId,
        level: currentLevel,
        paddleSpeed: paddle.speed,
        ballSpeed: Math.sqrt(balls[0].dx*balls[0].dx + balls[0].dy*balls[0].dy)
    });
}

function returnToMenu() {
    console.debug("Starting returnToMenu(). Initial state: menuActive=", menuActive, "currentLevel=", currentLevel);
    
    // 1. COMPLETELY STOP THE GAME AND ALL TIMERS
    
    // Cancel game drawing cycle
    if (gameLoopId) {
        console.debug("Canceling gameLoopId:", gameLoopId);
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Cancel all timers and timeouts
    if (transitionTimeout) {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
    }
    if (launchTimeout) {
        clearTimeout(launchTimeout);
        launchTimeout = null;
    }
    
    // Clear events to avoid duplicates
    document.removeEventListener('keydown', playOnKey);
    
    // 2. RESET ALL STATE VARIABLES
    
    menuActive = true; // CRUCIAL: activate menu mode
    showControls = false;
    selectedMenu = 0;
    paused = false;
    showGameOver = false;
    showLevelMessage = false;
    waitingToLaunch = false;
    isPaddleDestroyed = false;
    
    // Reset score, lives and level
    lives = 3;
    score = 0;
    currentLevel = 0; // Ensure we return to level 1
    
    // Clear visual effects
    brickExplosions = [];
    fadeOutBlocks = [];
    powerUps = [];
    
    // Reset speeds and effects
    resetGameSpeeds();
    
    // 3. RESTORE MENU INTERFACE
    
    // Reset paddle and ball state
    paddle.width = paddleOriginalWidth;
    paddle.height = paddleOriginalHeight;
    paddle.x = (canvas.width - paddle.width) / 2;
    resetBalls();
    
    // Restore menu handler (crucial)
    document.addEventListener('keydown', menuKeyDownHandler);
    
    // 4. START MENU CYCLE
    
    // Complete canvas cleanup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw menu immediately to avoid blank screen
    drawMenu();
    
    // Start menu animation with requestAnimationFrame
    if (menuLoopId) {
        cancelAnimationFrame(menuLoopId);
        menuLoopId = null;
    }
    menuLoopId = requestAnimationFrame(menuLoop);
    
    console.debug("Menu activated. Final state: menuActive=", menuActive, 
                "gameLoopId=", gameLoopId, "menuLoopId=", menuLoopId, 
                "currentLevel=", currentLevel);
}

// Inicialización
loadLevel(currentLevel);

// Pantalla completa al iniciar
requestFullscreen();

function drawLevelMessage(msg) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

// Función para manejar eventos del juego
function setupGameEvents() {
    // Remove existing event listeners to avoid duplicates
    document.removeEventListener('keydown', playOnKey);
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
    
    // Add game event listeners
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
}

// Función para reiniciar completamente el estado del juego
function resetGameState() {
    // Resetear velocidades y efectos
    resetGameSpeeds();
    
    // Resetear música
    backgroundMusic.playbackRate = 1.0;
    
    // Resetear paddle
    paddle.speed = 4;
    paddle.width = paddleOriginalWidth;
    paddle.height = paddleOriginalHeight;
    paddle.x = (canvas.width - paddle.width) / 2;
    
    // Resetear bolas
    resetBalls();
    
    // Resetear power-ups y efectos visuales
    powerUps = [];
    brickExplosions = [];
    fadeOutBlocks = [];
    
    // Resetear timers y contadores
    speedStackTimer = 0;
    powerUpTimers = {
        sizeStack: 0,
        speedStack: 0,
        invincible: 0,
        fireBall: 0
    };
    
    // Resetear estados de juego
    waitingToLaunch = true;
    showLevelMessage = false;
    showGameOver = false;
    isPaddleDestroyed = false;
    
    // Limpiar timeouts
    if (launchTimeout) clearTimeout(launchTimeout);
    if (transitionTimeout) clearTimeout(transitionTimeout);
    
    console.debug('Game state completely reset');
}

function loadLevel(levelIdx) {
    console.debug('Loading level', levelIdx);
    
    // Set up events
    setupGameEvents();
    
    // Reset complete game state
    resetGameState();
    
    // Load new level
    bricks = [];
    const asciiLevel = levels[levelIdx].map(row => row.padEnd(brickColumnCount, ' '));
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const char = asciiLevel[r][c] || ' ';
            let type = 0;
            if (char === '1') type = 1;
            else if (char === '2') type = 2;
            else if (char === '3' || char === '#') type = 3; // Cyan blocks (#) are indestructible
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: char === ' ' ? 0 : 1,
                hits: type === 2 ? 2 : (type === 1 ? 1 : 0),
                indestructible: type === 3,
                color: char
            };
        }
    }
    
    // Reset balls array
    balls.length = 0; // Clear the array
    balls.push(createBall()); // Add a new ball
    
    // Reset all power-ups and effects
    activePowerUps = {
        sizeStack: 0,
        speedStack: 0,
        invincible: false,
        fireBall: false,
        doubleSize: false
    };
    
    powerUpTimers = {
        sizeStack: 0,
        speedStack: 0,
        invincible: 0,
        fireBall: 0,
        doubleSize: 0
    };
    
    // Reset visual effects
    brickExplosions = [];
    fadeOutBlocks = [];
    powerUps = [];
    
    // Reset speeds and states
    paddle.width = paddleOriginalWidth;
    paddle.height = paddleOriginalHeight;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.speed = 4;
    
    // Reset music
    backgroundMusic.playbackRate = 1.0;
    
    // Set up automatic launch
    waitingToLaunch = true;
    if (launchTimeout) clearTimeout(launchTimeout);
    launchTimeout = setTimeout(launchBall, 3000);
    
    console.debug('Level loaded with ' + bricks.flat().filter(b => b.status === 1 && !b.indestructible).length + ' active destructible blocks');
}
}); 
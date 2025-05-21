document.addEventListener('DOMContentLoaded', function () {
    // Game configuration
    const DEFAULT_PADDLE_SPEED = 16;
    const DEFAULT_BALL_SPEED = 8.25;
    const POWERUP_FALL_SPEED = 3.75;
    const DEFAULT_BALL_LAUNCH_ANGLE = 1.15;
    const SCREEN_ASPECT_RATIO = 16 / 9;
    const POWERUP_WIDTH = 56;
    const POWERUP_HEIGHT = 24;
    const DEFAULT_BALL_RADIUS = 8;
    const DEFAULT_PADDLE_HEIGHT = 32;
    const DEFAULT_PADDLE_WIDTH = 160;
    const BRICK_ROW_COUNT = 20;
    const BRICK_COLUMN_COUNT = 15;
    const BRICK_WIDTH = 64;
    const BRICK_HEIGHT = 24;
    const BRICK_PADDING = 4;
    const BRICK_OFFSET_TOP = 12;
    const BRICK_OFFSET_LEFT = 8;
    const BORDER_THICKNESS = 24;
    const POWERUP_DURATION = 10; // seconds (adjusted)
    const INVINCIBLE_DURATION = 15; // seconds for invincible power-up
    const DOUBLE_SIZE_DURATION = 15; // seconds for double size power-up
    const PANEL_PADDING = 16;

    // Basic canvas configuration
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    // Adjust canvas size when resizing window 
    function adjustCanvas() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Maintain aspect ratio
        let newWidth, newHeight;
        if (windowWidth / windowHeight > SCREEN_ASPECT_RATIO) {
            // Window is wider than tall, adjust by height
            newHeight = windowHeight * 0.95; // Use 95% of available height
            newWidth = newHeight * SCREEN_ASPECT_RATIO;
        } else {
            // Window is taller than wide, adjust by width
            newWidth = windowWidth * 0.95; // Use 95% of available width
            newHeight = newWidth * (1 / SCREEN_ASPECT_RATIO);
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

    // Side panel
    const sidePanelWidth = 200; // Adjusted to maintain symmetry

    // Configuration of the game border    
    const gameBorder = {
        top: BORDER_THICKNESS,
        left: BORDER_THICKNESS,
        right: canvas.width - sidePanelWidth - BORDER_THICKNESS,
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
            '               ',
            '               ',
            '               ',
            '               ',
            '222222222222222', // Gray
            'WWWWWWWWWWWWWWW', // White
            'YYYYYYYYYYYYYYY', // Yellow
            'RRRRRRRRRRRRRRR', // Red
            'GGGGGGGGGGGGGGG', // Green
            'OOOOOOOOOOOOOOO', // Orange
            'PPPPPPPPPPPPPPP', // Purple
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               '
        ],
        [
            '               ',
            '               ',
            '               ',
            '               ',
            '2 2 2 222 2 2 2', // Gray
            'W W W WWW W W W', // White
            'Y Y Y YYY Y Y Y', // Yellow
            'R R R RRR R R R', // Red
            'G G G GGG G G G', // Green
            'O O O OOO O O O', // Orange
            'P P P PPP P P P', // Purple
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               '
        ],
        [
            '               ',
            '               ',
            '               ',
            '               ',
            '2222  222  2222', // Gray
            'W  W  WWW  W  W', // White
            'Y  Y  YYY  Y  Y', // Yellow
            'R  R  RRR  R  R', // Red
            'G  G  GGG  G  G', // Green
            'O  O  OOO  O  O', // Orange
            'PPPP  PPP  PPPP', // Purple
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               '
        ],
        [
            '               ',
            '               ',
            '               ',
            '               ',
            'WWWWWWWWWWWWWWW', // Gray
            '               ', // White
            'YYYYYYYYYYYYYYY', // Yellow
            '     #####     ', // Red
            'GGGGGGGGGGGGGGG', // Green
            '               ', // Orange
            'PPPPPPPPPPPPPPP', // Purple
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               '
        ],
        [
            '               ',
            '               ',
            '               ',
            '######   ######',
            'WWWWWWWWWWWWWWW', // Gray
            'WWWWWWWWWWWWWWW', // White
            'YYYYYYYYYYYYYYY', // Yellow
            'RRRRRRRRRRRRRRR', // Red
            'GGGGGGGGGGGGGGG', // Green
            'OOOOOOOOOOOOOOO', // Orange
            'PPPPPPPPPPPPPPP', // Purple
            '######   ######',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               ',
            '               '
        ]
    ];

    // Function to create a new ball
    function createBall(x, y, onPad = true) {
        const ball = {
            x: x || canvas.width / 2,
            y: y || canvas.height - 30,
            dx: 0,
            dy: 0,
            radius: DEFAULT_BALL_RADIUS,
            baseSpeed: DEFAULT_BALL_SPEED,
            onPad
        };

        return ball;
    }

    // Game objects
    let balls = [createBall()]; // Change from const to let

    const paddle = {
        x: (canvas.width - DEFAULT_PADDLE_WIDTH) / 2,
        y: canvas.height - DEFAULT_PADDLE_HEIGHT - 20,
        speed: 8,
        width: DEFAULT_PADDLE_WIDTH,
        height: DEFAULT_PADDLE_HEIGHT
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
    let launchTimeout = null;

    // Paddle destruction animation
    let paddleDestructionFrames = 0;
    let isPaddleDestroyed = false;

    // Variables for power-up effects
    let paddleOriginalWidth = DEFAULT_PADDLE_WIDTH;
    let paddleOriginalHeight = DEFAULT_PADDLE_HEIGHT;

    // Active power-ups
    let activePowerUps = {
        sizeStack: 0, // -5 to +5
        speedStack: 0, // -5 to +5
        invincible: false, // New power-up that allows bouncing on the bottom
        fireBall: false, // New power-up for fire balls
        doubleSize: false, // New power-up that quadruples ball size
        laser: false // New power-up for laser shots
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

    // --- POWER-UPS ---    
    let powerUpTimers = {
        sizeStack: 0,
        speedStack: 0,
        invincible: 0,
        fireBall: 0, // Timer for fire power-up
        doubleSize: 0, // Timer for double size power-up
        laser: 0 // Timer for laser power-up
    };
    let powerUpBarAlpha = {
        sizeStack: 0,
        speedStack: 0,
        invincible: 0,
        fireBall: 0, // Alpha for fire bar
        doubleSize: 0, // Alpha for double size bar
        laser: 0 // Alpha for laser bar
    };

    // Game variables
    let gameLoopId = null; // To control the main loop
    let menuLoopId = null; // To control the menu loop

    // Visual effects
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
        } else if (e.key === ' ' && activePowerUps.laser) { // Space to shoot
            const now = Date.now();
            if (now - lastLaserShot >= LASER_COOLDOWN) {
                // Create two laser shots from the paddle
                laserShots.push(createLaserShot(paddle.x + paddle.width * 0.25, paddle.y));
                laserShots.push(createLaserShot(paddle.x + paddle.width * 0.75, paddle.y));
                lastLaserShot = now;
                
                // Play shooting sound
                audioBounce.currentTime = 0;
                audioBounce.play();
            }
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
                    try {
                        if (window.electron && typeof window.electron.close === 'function') {
                            window.electron.close();
                        } else {
                            window.close();
                        }
                    } catch (error) {
                        console.error('Error al cerrar la ventana:', error);
                        window.close();
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
    let audioInitialized = false;    

    // Modify initBackgroundMusic function to ensure correct initialization
    function initBackgroundMusic() {       

        // Try to play music
        backgroundMusic.play().catch(error => {
            console.debug("Error playing music, waiting for user interaction:", error);
        });
    }

    // Modify click event to ensure initialization
    document.addEventListener('click', function playOnClick() {
        if (backgroundMusic.paused) {
            // Ensure audio is initialized            

            backgroundMusic.play().then(() => {
                console.debug("Music started by user interaction");
                document.removeEventListener('click', playOnClick);
            }).catch(error => {
                console.debug("Error playing music on click:", error);
            });
        }
    });

    // Modify keydown event to ensure initialization
    const playOnKey = function (e) {
        if (backgroundMusic.paused) {
            // Ensure audio is initialized
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
        { type: 'B', color: '#00bcd4' },   // Barrier (bottom bounce)
        { type: '+', color: '#00ff00' },   // Extra ball (ahora verde)
        { type: 'F', color: '#ff4500' },   // Fire ball
        { type: 'D', color: '#9c27b0' },   // Double size ball
        { type: 'L', color: '#e91e63' }    // Laser power-up (ahora rosa)
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
                    width: POWERUP_WIDTH,
                    height: POWERUP_HEIGHT,
                    dy: POWERUP_FALL_SPEED
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
            const f0 = proj(-w / 2, -h / 2, 0);
            const f1 = proj(w / 2, -h / 2, 0);
            const f2 = proj(w / 2, h / 2, 0);
            const f3 = proj(-w / 2, h / 2, 0);
            // Side face (z=0 to z=-d, y=h/2)
            const l0 = proj(-w / 2, h / 2, 0);
            const l1 = proj(w / 2, h / 2, 0);
            const l2 = proj(w / 2, h / 2, -d);
            const l3 = proj(-w / 2, h / 2, -d);
            // Top face (z=0 to z=-d, y=-h/2)
            const s0 = proj(-w / 2, -h / 2, 0);
            const s1 = proj(w / 2, -h / 2, 0);
            const s2 = proj(w / 2, -h / 2, -d);
            const s3 = proj(-w / 2, -h / 2, -d);

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

            // Top face
            ctx.beginPath();
            ctx.moveTo(s0.x, s0.y);
            ctx.lineTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.lineTo(s3.x, s3.y);
            ctx.closePath();
            ctx.fillStyle = shadeColor(pu.color, 20); // Lighter version of color
            ctx.fill();
        });
    }

    // Helper function to darken or lighten a color
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

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

        return "#" + RR + GG + BB;
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
                const newBall = createBall(paddle.x + paddle.width / 2, paddle.y - 8, false);
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
            case 'L':
                activePowerUps.laser = true;
                powerUpTimers.laser = LASER_DURATION;
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
        paddle.speed = DEFAULT_PADDLE_SPEED;

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

    // Sistema de partículas para efectos de fuego
    const fireParticles = [];
    const smokeParticles = [];
    const MAX_FIRE_PARTICLES = 20;
    const MAX_SMOKE_PARTICLES = 15;

    // Función para crear una partícula de fuego
    function createFireParticle(x, y) {
        return {
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 2,
            speedY: -Math.random() * 2 - 1,
            life: 1.0,
            color: `hsl(${Math.random() * 30 + 15}, 100%, ${Math.random() * 20 + 50}%)`
        };
    }

    // Función para crear una partícula de humo
    function createSmokeParticle(x, y) {
        return {
            x: x,
            y: y,
            size: Math.random() * 6 + 4,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: -Math.random() * 1.5 - 0.5,
            life: 1.0,
            alpha: 0.7
        };
    }

    // Función para actualizar y dibujar las partículas
    function updateAndDrawParticles() {
        // Batch particle updates
        const particlesToRemove = [];
        
        // Update fire particles
        for (let i = fireParticles.length - 1; i >= 0; i--) {
            const p = fireParticles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= 0.02;
            p.size *= 0.95;

            if (p.life <= 0) {
                particlesToRemove.push(i);
                continue;
            }

            // Batch drawing
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Remove dead particles
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            fireParticles.splice(particlesToRemove[i], 1);
        }

        // Similar optimization for smoke particles
        // ... existing code ...
    }

    // Modificar la función drawBall para incluir los efectos de fuego
    function drawBall(ball) {
        // Ball as sphere with radial gradient
        ctx.save();

        // Calculate ball radius based on power-up
        const currentRadius = activePowerUps.doubleSize ? ball.radius * 2 : ball.radius;

        // Si la bola tiene efecto de fuego
        if (activePowerUps.fireBall) {
            // Calcular parpadeo si quedan menos de 3 segundos
            let alpha = 1.0;
            if (powerUpTimers.fireBall <= 3.0) {
                alpha = 0.3 + 0.7 * Math.abs(Math.sin(powerUpTimers.fireBall * Math.PI * 2));
            }

            // Gradiente de fuego
            const grad = ctx.createRadialGradient(
                ball.x - currentRadius / 3,
                ball.y - currentRadius / 3,
                currentRadius / 4,
                ball.x,
                ball.y,
                currentRadius
            );
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.3, `rgba(255, 165, 0, ${alpha})`);
            grad.addColorStop(0.7, `rgba(255, 69, 0, ${alpha})`);
            grad.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);

            // Dibujar bola con gradiente de fuego
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Efecto de resplandor
            ctx.shadowColor = `rgba(255, 69, 0, ${alpha * 0.5})`;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            // Generar partículas de fuego y humo
            if (Math.random() < 0.3 && fireParticles.length < MAX_FIRE_PARTICLES) {
                fireParticles.push(createFireParticle(
                    ball.x + (Math.random() - 0.5) * currentRadius,
                    ball.y + (Math.random() - 0.5) * currentRadius
                ));
            }

            if (Math.random() < 0.2 && smokeParticles.length < MAX_SMOKE_PARTICLES) {
                smokeParticles.push(createSmokeParticle(
                    ball.x + (Math.random() - 0.5) * currentRadius * 1.5,
                    ball.y + (Math.random() - 0.5) * currentRadius * 1.5
                ));
            }
        } else {
            // Bola normal
            const grad = ctx.createRadialGradient(
                ball.x - currentRadius / 3,
                ball.y - currentRadius / 3,
                currentRadius / 4,
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

    // Add at the top with other game variables
    let gradientAnimation = 0; // Variable para la animación del gradiente

    // Add at the top with other game variables
    let paddleParticles = []; // Array para las partículas de desintegración del paddle
    const PADDLE_PARTICLE_COUNT = 30; // Número de partículas para la desintegración
    const PADDLE_PARTICLE_LIFETIME = 1.0; // Duración de la animación en segundos

    // Función para crear partículas de desintegración del paddle
    function createPaddleParticles() {
        paddleParticles = [];
        const particleSize = paddle.width / PADDLE_PARTICLE_COUNT;
        
        for (let i = 0; i < PADDLE_PARTICLE_COUNT; i++) {
            // Crear partículas distribuidas a lo largo del paddle
            const x = paddle.x + (i * particleSize);
            const y = paddle.y + (Math.random() * paddle.height);
            
            // Crear múltiples partículas por cada posición para más densidad
            for (let j = 0; j < 3; j++) {
                paddleParticles.push({
                    x: x + (Math.random() * particleSize),
                    y: y,
                    size: particleSize * (0.5 + Math.random() * 0.5),
                    speedX: (Math.random() - 0.5) * 8,
                    speedY: -Math.random() * 8 - 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    life: 1.0,
                    color: i % 2 === 0 ? '#1976d2' : '#ff0000' // Alternar entre azul y rojo
                });
            }
        }
    }

    // Función para actualizar y dibujar las partículas del paddle
    function updateAndDrawPaddleParticles() {
        for (let i = paddleParticles.length - 1; i >= 0; i--) {
            const p = paddleParticles[i];
            
            // Actualizar posición y rotación
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            p.life -= 0.02;
            p.size *= 0.95;

            if (p.life <= 0) {
                paddleParticles.splice(i, 1);
                continue;
            }

            // Dibujar partícula
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            // Gradiente para cada partícula
            const gradient = ctx.createLinearGradient(-p.size/2, -p.size/2, p.size/2, p.size/2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, shadeColor(p.color, -30));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.rect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.fill();
            
            // Efecto de brillo
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 5;
            ctx.strokeStyle = shadeColor(p.color, 30);
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
    }

    function drawPaddle() {
        // Paddle with semicircle tips and new blue design
        ctx.save();
        if (isPaddleDestroyed) {
            if (paddleParticles.length === 0) {
                createPaddleParticles();
            }
            updateAndDrawPaddleParticles();
            return;
        }

        // Update gradient animation
        gradientAnimation += 0.02;
        const sinValue = Math.sin(gradientAnimation);
        const cosValue = Math.cos(gradientAnimation);

        // Create gradient for the paddle with animation
        const gradient = ctx.createLinearGradient(
            paddle.x + sinValue * 20, 
            paddle.y + cosValue * 10,
            paddle.x + paddle.width - sinValue * 20,
            paddle.y + paddle.height - cosValue * 10
        );
        
        // If laser is active, use animated green gradient
        if (activePowerUps.laser) {
            const greenIntensity = 0.7 + 0.3 * Math.sin(gradientAnimation * 2);
            gradient.addColorStop(0, `rgba(0, 255, 0, ${greenIntensity})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 100, ${greenIntensity})`);
            gradient.addColorStop(1, `rgba(0, 200, 0, ${greenIntensity})`);
            
            // More intense pulsing glow effect
            const pulseIntensity = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() / 100));
            ctx.shadowColor = `rgba(0, 255, 0, ${pulseIntensity})`;
            ctx.shadowBlur = 15 + Math.sin(gradientAnimation * 3) * 5;
        } else {
            // Animated blue gradient for normal paddle
            gradient.addColorStop(0, `rgba(25, 118, 210, ${0.8 + 0.2 * sinValue})`);
            gradient.addColorStop(0.5, `rgba(100, 181, 246, ${0.8 + 0.2 * cosValue})`);
            gradient.addColorStop(1, `rgba(25, 118, 210, ${0.8 + 0.2 * sinValue})`);
            
            // Soft glow effect
            ctx.shadowColor = 'rgba(25, 118, 210, 0.3)';
            ctx.shadowBlur = 10 + Math.sin(gradientAnimation * 2) * 5;
        }

        // Draw paddle with semicircle red tips
        const tipWidth = paddle.height / 2; // Width of the semicircle tips

        // Draw main paddle body (blue)
        ctx.beginPath();
        ctx.moveTo(paddle.x + tipWidth, paddle.y);
        ctx.lineTo(paddle.x + paddle.width - tipWidth, paddle.y);
        ctx.lineTo(paddle.x + paddle.width - tipWidth, paddle.y + paddle.height);
        ctx.lineTo(paddle.x + tipWidth, paddle.y + paddle.height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw red tips with yellow glow
        const redIntensity = 0.8 + 0.2 * Math.sin(gradientAnimation * 2);
        
        // Add yellow glow to the tips
        ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
        ctx.shadowBlur = 15;
        
        // Left tip
        ctx.beginPath();
        ctx.arc(paddle.x + tipWidth, paddle.y + paddle.height/2, tipWidth, Math.PI/2, Math.PI*3/2, false);
        ctx.fillStyle = `rgba(255, 0, 0, ${redIntensity})`;
        ctx.fill();
        
        // Right tip
        ctx.beginPath();
        ctx.arc(paddle.x + paddle.width - tipWidth, paddle.y + paddle.height/2, tipWidth, Math.PI*3/2, Math.PI/2, false);
        ctx.fillStyle = `rgba(255, 0, 0, ${redIntensity})`;
        ctx.fill();

        // Reset shadow for borders
        ctx.shadowBlur = 0;
        
        // Add subtle border to tips
        ctx.strokeStyle = `rgba(255, 0, 0, ${redIntensity * 0.5})`;
        ctx.lineWidth = 1;
        
        // Draw tip borders
        ctx.beginPath();
        ctx.arc(paddle.x + tipWidth, paddle.y + paddle.height/2, tipWidth, Math.PI/2, Math.PI*3/2, false);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(paddle.x + paddle.width - tipWidth, paddle.y + paddle.height/2, tipWidth, Math.PI*3/2, Math.PI/2, false);
        ctx.stroke();

        // If laser is active, add animated "cannon" details
        if (activePowerUps.laser) {
            // Draw animated cannons at the ends
            const cannonWidth = 6;
            const cannonHeight = 8 + Math.sin(gradientAnimation * 3) * 2;
            
            // Left cannon
            ctx.fillStyle = `rgba(0, 255, 0, ${0.8 + 0.2 * Math.sin(gradientAnimation * 2)})`;
            ctx.fillRect(paddle.x + paddle.width * 0.25 - cannonWidth/2, paddle.y - cannonHeight, cannonWidth, cannonHeight);
            
            // Right cannon
            ctx.fillRect(paddle.x + paddle.width * 0.75 - cannonWidth/2, paddle.y - cannonHeight, cannonWidth, cannonHeight);
            
            // Cannon glow effect
            ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            ctx.shadowBlur = 10 + Math.sin(gradientAnimation * 2) * 5;
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.8 + 0.2 * Math.sin(gradientAnimation * 2)})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(paddle.x + paddle.width * 0.25 - cannonWidth/2, paddle.y - cannonHeight, cannonWidth, cannonHeight);
            ctx.strokeRect(paddle.x + paddle.width * 0.75 - cannonWidth/2, paddle.y - cannonHeight, cannonWidth, cannonHeight);
        }

        // Add very subtle border to main body
        const borderColor = activePowerUps.laser ? 
            `rgba(0, 255, 0, ${0.3 + 0.1 * Math.sin(gradientAnimation * 2)})` : 
            `rgba(179, 229, 252, ${0.2 + 0.1 * Math.sin(gradientAnimation)})`;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        
        // Draw main body border
        ctx.beginPath();
        ctx.moveTo(paddle.x + tipWidth, paddle.y);
        ctx.lineTo(paddle.x + paddle.width - tipWidth, paddle.y);
        ctx.lineTo(paddle.x + paddle.width - tipWidth, paddle.y + paddle.height);
        ctx.lineTo(paddle.x + tipWidth, paddle.y + paddle.height);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    // Add at the top with other game variables
    let currentAnimatedBlock = null;
    let animationTimer = 0;

    // Animation constants
    const ANIMATION_PATTERNS = 4; // Number of different animation patterns
    const MIN_ANIMATION_DURATION = 800; // Increased from 300 to 800
    const MAX_ANIMATION_DURATION = 2000; // Increased from 800 to 2000
    const BLOCK_CHANGE_INTERVAL = 2000; // Increased from 1000 to 2000
    const MAX_ANIMATED_BLOCKS_PERCENTAGE = 0.2; // 20% of total active blocks

    // Add at the top with other game variables
    let animatedBlocks = []; // Array to maintain multiple animated blocks
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
        animatedBlocks = animatedBlocks.filter(block => now - block.startTime < block.duration);

        // Count active blocks
        let activeBlocksCount = 0;
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                if (bricks[c][r].status === 1 || bricks[c][r].indestructible) {
                    activeBlocksCount++;
                }
            }
        }

        // Calculate maximum animated blocks (20% of total)
        const maxAnimatedBlocks = Math.max(1, Math.floor(activeBlocksCount * MAX_ANIMATED_BLOCKS_PERCENTAGE));

        // Select new blocks to animate if needed
        if (animatedBlocks.length < maxAnimatedBlocks && now - animationTimer > BLOCK_CHANGE_INTERVAL) {
            // Find all active blocks that are not being animated
            const activeBlocks = [];
            for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
                for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                    if ((bricks[c][r].status === 1 || bricks[c][r].indestructible) && 
                        !animatedBlocks.some(block => block.c === c && block.r === r)) {
                        activeBlocks.push({ c, r });
                    }
                }
            }

            // Select random blocks to animate
            while (animatedBlocks.length < maxAnimatedBlocks && activeBlocks.length > 0) {
                const randomIndex = Math.floor(Math.random() * activeBlocks.length);
                const block = activeBlocks.splice(randomIndex, 1)[0];
                animatedBlocks.push({
                    ...block,
                    ...generateAnimationPattern()
                });
            }

            animationTimer = now;
        }

        // Draw all bricks
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricks[c][r];
                if (b.status === 1 || b.indestructible) {
                    const brickX = BORDER_THICKNESS + BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
                    const brickY = BORDER_THICKNESS + BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);
                    b.x = brickX;
                    b.y = brickY;

                    // Determine block color based on type
                    let mainColor;
                    if (b.indestructible) {
                        mainColor = '#00ffff'; // Cyan for indestructible
                    } else if (b.color === '2') { // Gray block
                        if (b.hits === 1) {
                            mainColor = '#aaaaaa';
                        } else {
                            mainColor = '#888888';
                        }
                    } else {
                        switch (b.color) {
                            case 'W': mainColor = '#f5f5f5'; break; // White
                            case 'Y': mainColor = '#ffd600'; break; // Yellow
                            case 'R': mainColor = '#f44336'; break; // Red
                            case 'G': mainColor = '#4caf50'; break; // Green
                            case 'O': mainColor = '#ff9800'; break; // Orange
                            case 'P': mainColor = '#9c27b0'; break; // Purple
                            case '#': mainColor = '#00bcd4'; break; // Blue
                            default: mainColor = '#f5f5f5'; // White (default)
                        }
                    }

                    // Check if this block is being animated
                    const animatedBlock = animatedBlocks.find(block => block.c === c && block.r === r);
                    if (animatedBlock) {
                        const intensity = calculateAnimationIntensity(animatedBlock);
                        
                        // Apply glow effect based on animation intensity
                        ctx.shadowColor = mainColor;
                        ctx.shadowBlur = 10 + intensity * 20;
                        
                        // Adjust color brightness based on animation
                        const color = adjustColorBrightness(mainColor, intensity * 0.5);
                        ctx.fillStyle = color;
                    } else {
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = mainColor;
                    }

                    ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Draw the fading blocks
        drawFadingBlocks();
    }

    // Función auxiliar para ajustar el brillo de un color
    function adjustColorBrightness(color, factor) {
        // Convertir color hex a RGB
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Ajustar brillo
        const newR = Math.min(255, Math.max(0, r + (255 - r) * factor));
        const newG = Math.min(255, Math.max(0, g + (255 - g) * factor));
        const newB = Math.min(255, Math.max(0, b + (255 - b) * factor));
        
        // Convertir de vuelta a hex
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
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
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            color: color,
            time: 1.0, // Initial life time (1.0 = 100%)
            originalWidth: BRICK_WIDTH,
            originalHeight: BRICK_HEIGHT
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

            // Draw the fading block
            ctx.save();
            ctx.globalAlpha = block.time;
            ctx.fillStyle = block.color;
            ctx.fillRect(
                block.x + (block.originalWidth - newWidth) / 2,
                block.y + (block.originalHeight - newHeight) / 2,
                newWidth,
                newHeight
            );
            ctx.restore();
        }
    }

    function drawScore() {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, gameBorder.right + BORDER_THICKNESS + PANEL_PADDING, gameBorder.top + 16);
    }

    function drawLives() {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#0095DD';
        ctx.textAlign = 'left';
        ctx.fillText(`Lives: ${lives}`, gameBorder.right + BORDER_THICKNESS + PANEL_PADDING, gameBorder.top + 55);
    }

    // Función auxiliar para verificar la completación del nivel
    function checkLevelCompletion() {
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
    }

    function collisionDetection() {
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricks[c][r];
                for (let ball of balls) {
                    if ((b.status === 1 || b.indestructible) && ball.x > b.x && ball.x < b.x + BRICK_WIDTH && ball.y > b.y && ball.y < b.y + BRICK_HEIGHT) {
                        // Calcular el radio actual de la bola
                        const currentRadius = activePowerUps.doubleSize ? ball.radius * 2 : ball.radius;
                        const isBigBall = activePowerUps.doubleSize;

                        // Lógica para bolas de fuego
                        if (activePowerUps.fireBall) {
                            // Para bloques normales: atravesar y destruir
                            if (!b.indestructible && b.color !== '2') {
                                b.status = 0;
                                score++;
                                audioBrick.currentTime = 0;
                                audioBrick.play();
                                createBrickExplosion(b);
                                spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                            }
                            // Para bloques grises (2 hits): solo atravesar si es bola grande
                            else if (b.color === '2') {
                                if (isBigBall) {
                                    b.status = 0;
                                    score++;
                                    audioBrick.currentTime = 0;
                                    audioBrick.play();
                                    createBrickExplosion(b);
                                    spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                                } else {
                                    // Si es bola normal, comportarse como una bola sin fuego
                                    handleBounce(ball, b);
                                    if (b.hits > 1) {
                                        b.hits--;
                                    } else {
                                        b.status = 0;
                                        score++;
                                        audioBrick.currentTime = 0;
                                        audioBrick.play();
                                        createBrickExplosion(b);
                                        spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                                    }
                                }
                            }
                            // Para bloques indestructibles: solo atravesar si es bola grande
                            else if (b.indestructible) {
                                if (isBigBall) {
                                    b.status = 0;
                                    b.indestructible = false;
                                    score++;
                                    audioBrick.currentTime = 0;
                                    audioBrick.play();
                                    createBrickExplosion(b);
                                    spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                                } else {
                                    // Si es bola normal, rebotar pero destruir
                                    handleBounce(ball, b);
                                    b.status = 0;
                                    b.indestructible = false;
                                    score++;
                                    audioBrick.currentTime = 0;
                                    audioBrick.play();
                                    createBrickExplosion(b);
                                    spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                                }
                            }
                        } else {
                            // Lógica normal para bolas sin fuego
                            handleBounce(ball, b);
                            if (b.color === '2') { // Bloque gris
                                if (b.hits > 1) {
                                    b.hits--;
                                } else {
                                    b.status = 0;
                                    score++;
                                    audioBrick.currentTime = 0;
                                    audioBrick.play();
                                    createBrickExplosion(b);
                                    spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                                }
                            } else if (!b.indestructible) {
                                b.status = 0;
                                score++;
                                audioBrick.currentTime = 0;
                                audioBrick.play();
                                createBrickExplosion(b);
                                spawnPowerUp(b.x + BRICK_WIDTH / 2 - 14, b.y + BRICK_HEIGHT / 2 - 14);
                            }
                        }

                        // Verificar completación del nivel
                        checkLevelCompletion();

                        // Important: exit the loop after a collision to avoid multiple collisions
                        return;
                    }
                }
            }
        }
    }

    // Función auxiliar para manejar el rebote con físicas realistas
    function handleBounce(ball, brick) {
        // 1. Calcular el punto de impacto relativo al centro del bloque
        const blockCenterX = brick.x + BRICK_WIDTH / 2;
        const blockCenterY = brick.y + BRICK_HEIGHT / 2;
        const impactX = ball.x - blockCenterX;
        const impactY = ball.y - blockCenterY;

        // 2. Calcular la posición anterior de la bola
        const prevX = ball.x - ball.dx;
        const prevY = ball.y - ball.dy;

        // 3. Determinar el lado de impacto basado en la trayectoria
        let hitSide = '';
        let normalX = 0;
        let normalY = 0;

        // Calcular las distancias a cada borde
        const distToLeft = Math.abs(prevX - brick.x);
        const distToRight = Math.abs(prevX - (brick.x + BRICK_WIDTH));
        const distToTop = Math.abs(prevY - brick.y);
        const distToBottom = Math.abs(prevY - (brick.y + BRICK_HEIGHT));

        // Encontrar el borde más cercano y su vector normal
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

        if (minDist === distToLeft) {
            hitSide = 'left';
            normalX = -1;
            normalY = 0;
            ball.x = brick.x - ball.radius;
        } else if (minDist === distToRight) {
            hitSide = 'right';
            normalX = 1;
            normalY = 0;
            ball.x = brick.x + BRICK_WIDTH + ball.radius;
        } else if (minDist === distToTop) {
            hitSide = 'top';
            normalX = 0;
            normalY = -1;
            ball.y = brick.y - ball.radius;
        } else {
            hitSide = 'bottom';
            normalX = 0;
            normalY = 1;
            ball.y = brick.y + BRICK_HEIGHT + ball.radius;
        }

        // 4. Calcular el vector de velocidad actual
        const velocityX = ball.dx;
        const velocityY = ball.dy;

        // 5. Calcular el producto punto para la reflexión
        const dotProduct = velocityX * normalX + velocityY * normalY;

        // 6. Aplicar la ley de reflexión: R = V - 2(V·N)N
        ball.dx = velocityX - 2 * dotProduct * normalX;
        ball.dy = velocityY - 2 * dotProduct * normalY;

        // 7. Aplicar efecto de "spin" basado en el punto de impacto
        const spinFactor = 0.15;
        if (hitSide === 'left' || hitSide === 'right') {
            // Spin vertical basado en la posición Y del impacto
            const relativeY = (ball.y - brick.y) / BRICK_HEIGHT;
            ball.dy += (relativeY - 0.5) * spinFactor * ball.baseSpeed;
        } else {
            // Spin horizontal basado en la posición X del impacto
            const relativeX = (ball.x - brick.x) / BRICK_WIDTH;
            ball.dx += (relativeX - 0.5) * spinFactor * ball.baseSpeed;
        }

        // 8. Normalizar la velocidad para mantener una velocidad constante
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        const speedFactor = ball.baseSpeed / currentSpeed;
        ball.dx *= speedFactor;
        ball.dy *= speedFactor;

        // 9. Reproducir sonido apropiado
        if (brick.indestructible) {
            audioMetalClick.currentTime = 0;
            audioMetalClick.play();
        } else {
            audioBrick.currentTime = 0;
            audioBrick.play();
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
                ball.onPad = false;

                // Lanzar la bola usando el mismo ángulo que en createBall
                const angle = DEFAULT_BALL_LAUNCH_ANGLE;
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
        const textWidth = 60; // Ancho reservado para el texto
        // Positioning in the side panel
        let x = gameBorder.right + BORDER_THICKNESS + PANEL_PADDING;
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
                color: '#2196f3', // Azul para E+/E-
                active: activePowerUps.sizeStack !== 0
            });
        }

        if (activePowerUps.speedStack !== 0 || powerUpBarAlpha.speedStack > 0.01) {
            activeBars.push({
                type: 'Speed',
                timer: powerUpTimers.speedStack,
                alpha: powerUpBarAlpha.speedStack,
                color: '#ff9800', // Naranja para S+/S-
                active: activePowerUps.speedStack !== 0
            });
        }

        if (activePowerUps.invincible || powerUpBarAlpha.invincible > 0.01) {
            activeBars.push({
                type: 'Barrier',
                timer: powerUpTimers.invincible,
                alpha: powerUpBarAlpha.invincible,
                color: '#00bcd4', // Turquesa para Barrier
                active: activePowerUps.invincible
            });
        }

        if (activePowerUps.fireBall || powerUpBarAlpha.fireBall > 0.01) {
            activeBars.push({
                type: 'Fire',
                timer: powerUpTimers.fireBall,
                alpha: powerUpBarAlpha.fireBall,
                color: '#ff4500', // Rojo para Fire Ball
                active: activePowerUps.fireBall
            });
        }

        if (activePowerUps.doubleSize || powerUpBarAlpha.doubleSize > 0.01) {
            activeBars.push({
                type: 'Double',
                timer: powerUpTimers.doubleSize,
                alpha: powerUpBarAlpha.doubleSize,
                color: '#9c27b0', // Púrpura para Double Size
                active: activePowerUps.doubleSize
            });
        }

        if (activePowerUps.laser || powerUpBarAlpha.laser > 0.01) {
            activeBars.push({
                type: 'Laser',
                timer: powerUpTimers.laser,
                alpha: powerUpBarAlpha.laser,
                color: '#e91e63', // Rosa para Laser
                active: activePowerUps.laser
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
                else if (bar.type === 'Laser') powerUpBarAlpha.laser = bar.alpha;
            } else if (!bar.active && bar.alpha > 0) {
                bar.alpha -= 0.05;
                if (bar.alpha < 0) bar.alpha = 0;

                // Update the alpha in the original object
                if (bar.type === 'Size') powerUpBarAlpha.sizeStack = bar.alpha;
                else if (bar.type === 'Speed') powerUpBarAlpha.speedStack = bar.alpha;
                else if (bar.type === 'Barrier') powerUpBarAlpha.invincible = bar.alpha;
                else if (bar.type === 'Fire') powerUpBarAlpha.fireBall = bar.alpha;
                else if (bar.type === 'Double') powerUpBarAlpha.doubleSize = bar.alpha;
                else if (bar.type === 'Laser') powerUpBarAlpha.laser = bar.alpha;
            }

            // Y position (from top to bottom)
            const barY = y + (i * (barH + gap));

            // Dibujar el texto primero
            ctx.globalAlpha = bar.alpha;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(bar.type, x, barY + barH - 2);

            // Dibujar la barra después del texto
            ctx.globalAlpha = bar.alpha;
            ctx.fillStyle = bar.color;

            // Calculating the maximum duration depending on the type
            let maxDuration = POWERUP_DURATION;
            if (bar.type === 'Barrier') maxDuration = INVINCIBLE_DURATION;
            else if (bar.type === 'Double') maxDuration = DOUBLE_SIZE_DURATION;
            else if (bar.type === 'Laser') maxDuration = LASER_DURATION;

            // Dibujar la barra con efecto de brillo si es el láser
            if (bar.type === 'Laser' && bar.active) {
                ctx.shadowColor = 'rgba(233, 30, 99, 0.5)'; // Cambiado a rosa
                ctx.shadowBlur = 10;
            }

            // Dibujar la barra después del texto
            ctx.fillRect(x + textWidth, barY, (barW - textWidth) * (bar.timer / maxDuration), barH);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(x + textWidth, barY, barW - textWidth, barH);

            // Resetear efectos de brillo
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Function for the bounce on walls with the new borders
    function handleWallCollisions() {
        for (let ball of balls) {
            // Calcular la posición siguiente de la bola
            const nextX = ball.x + ball.dx;
            const nextY = ball.y + ball.dy;
            const currentRadius = activePowerUps.doubleSize ? ball.radius * 2 : ball.radius;

            // Colisión con bordes laterales
            if (nextX - currentRadius < gameBorder.left) {
                ball.x = gameBorder.left + currentRadius;
                ball.dx = Math.abs(ball.dx); // Asegurar que vaya hacia la derecha
                audioBounce.currentTime = 0;
                audioBounce.play();
            } else if (nextX + currentRadius > gameBorder.right) {
                ball.x = gameBorder.right - currentRadius;
                ball.dx = -Math.abs(ball.dx); // Asegurar que vaya hacia la izquierda
                audioBounce.currentTime = 0;
                audioBounce.play();
            }

            // Colisión con el techo
            if (nextY - currentRadius < gameBorder.top) {
                ball.y = gameBorder.top + currentRadius;
                ball.dy = Math.abs(ball.dy); // Asegurar que vaya hacia abajo
                audioBounce.currentTime = 0;
                audioBounce.play();
            }

            // Colisión con el suelo (solo si no hay power-up de invencibilidad)
            if (!activePowerUps.invincible && nextY + currentRadius > canvas.height) {
                // Si no es invencible, perder la bola
                const ballIndex = balls.indexOf(ball);
                if (ballIndex > -1) {
                    balls.splice(ballIndex, 1);
                }

                // Si no quedan bolas, perder una vida
                if (balls.length === 0) {
                    lives--;
                    if (lives <= 0) {
                        showGameOver = true;
                        gameOverHandled = false;
                    } else {
                        // Iniciar animación de destrucción
                        isPaddleDestroyed = true;
                        createPaddleParticles();
                        
                        // Esperar a que termine la animación antes de resetear
                        setTimeout(() => {
                            isPaddleDestroyed = false;
                            paddleParticles = [];
                            paddle.x = (canvas.width - paddle.width) / 2;
                            paddle.width = paddleOriginalWidth;
                            paddle.height = paddleOriginalHeight;
                            resetBalls();
                            waitingToLaunch = true;
                            if (launchTimeout) clearTimeout(launchTimeout);
                            launchTimeout = setTimeout(() => {
                                launchBall();
                            }, 3000);
                            backgroundMusic.playbackRate = 1;
                            activePowerUps = {
                                sizeStack: 0,
                                speedStack: 0,
                                invincible: false,
                                fireBall: false
                            };
                            speedStackTimer = 0;
                            powerUps = [];
                        }, PADDLE_PARTICLE_LIFETIME * 1000);
                    }
                }
            } else if (activePowerUps.invincible && nextY + currentRadius > canvas.height - BORDER_THICKNESS) {
                // Si es invencible, rebotar en el suelo
                ball.y = canvas.height - BORDER_THICKNESS - currentRadius;
                ball.dy = -Math.abs(ball.dy); // Asegurar que vaya hacia arriba
                audioBounce.currentTime = 0;
                audioBounce.play();
            }

            // Verificar colisión con el paddle
            if (ball.y + currentRadius <= paddle.y && nextY + currentRadius >= paddle.y) {
                if (nextX + currentRadius > paddle.x && nextX - currentRadius < paddle.x + paddle.width) {
                    // Calcular el punto exacto de colisión en Y
                    ball.y = paddle.y - currentRadius;

                    // Calcular la posición relativa de impacto (0 a 1)
                    const relativeIntersectX = (ball.x - paddle.x) / paddle.width;

                    // Calcular la velocidad del paddle en el momento del impacto
                    const paddleSpeed = rightPressed ? paddle.speed : (leftPressed ? -paddle.speed : 0);

                    // Calcular el ángulo base de rebote (más pronunciado en los extremos)
                    const normalizedPosition = relativeIntersectX * 2 - 1; // Convertir a rango -1 a 1
                    const angleFactor = Math.sign(normalizedPosition) * Math.pow(Math.abs(normalizedPosition), 1.5);
                    const maxBounceAngle = Math.PI / 3; // 60 grados máximo
                    const minBounceAngle = Math.PI / 6; // 30 grados mínimo
                    let bounceAngle = angleFactor * maxBounceAngle;

                    // Asegurar que el ángulo no sea demasiado horizontal
                    if (Math.abs(bounceAngle) < minBounceAngle) {
                        bounceAngle = Math.sign(bounceAngle) * minBounceAngle;
                    }

                    // Aplicar efecto de "spin" basado en la velocidad del paddle
                    const spinFactor = 0.2;
                    const spinEffect = paddleSpeed * spinFactor;

                    // Calcular la nueva velocidad
                    const newSpeed = ball.baseSpeed;
                    ball.dx = newSpeed * Math.sin(bounceAngle) + spinEffect;
                    ball.dy = -Math.abs(newSpeed * Math.cos(bounceAngle));

                    // Asegurar velocidad mínima
                    const minSpeed = ball.baseSpeed * 0.8;
                    const actualSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    if (actualSpeed < minSpeed) {
                        const speedFactor = minSpeed / actualSpeed;
                        ball.dx *= speedFactor;
                        ball.dy *= speedFactor;
                    }

                    // Limitar velocidad máxima
                    const maxSpeed = ball.baseSpeed * 1.2;
                    if (actualSpeed > maxSpeed) {
                        const speedFactor = maxSpeed / actualSpeed;
                        ball.dx *= speedFactor;
                        ball.dy *= speedFactor;
                    }

                    // Verificación final para asegurar que no haya rebote horizontal
                    const finalAngle = Math.atan2(ball.dy, ball.dx);
                    if (Math.abs(finalAngle) < minBounceAngle) {
                        const newAngle = Math.sign(finalAngle) * minBounceAngle;
                        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        ball.dx = speed * Math.cos(newAngle);
                        ball.dy = speed * Math.sin(newAngle);
                    }

                    audioBounce.currentTime = 0;
                    audioBounce.play();
                }
            }
        }
    }

    function requestFullscreen() {
        try {
            // Intentar maximizar la ventana primero
            if (window.electron) {
                window.electron.maximize();
            }

            // Luego intentar pantalla completa
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen();
            } else if (canvas.mozRequestFullScreen) {
                canvas.mozRequestFullScreen();
            } else if (canvas.msRequestFullscreen) {
                canvas.msRequestFullscreen();
            }

            // Ajustar el canvas después de un breve retraso
            setTimeout(adjustCanvas, 100);
        } catch (error) {
            console.debug("Error al intentar maximizar la ventana:", error);
        }
    }

    // Keyboard events for global controls
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (!menuActive && !paused) {
                // We are in the game, return to the menu
                returnToMenu();
            } else if (menuActive) {
                // We are in the menu, try to close the window
                console.debug("ESC pressed in the menu. Trying to close window...");
                try {
                    if (window.electron && typeof window.electron.close === 'function') {
                        window.electron.close();
                    } else {
                        window.close();
                    }
                } catch (error) {
                    console.error('Error al cerrar la ventana:', error);
                    window.close();
                }
            }
        } else if (e.key === 'r' || e.key === 'R') {
            // Toggle FPS counter visibility
            showFpsCounter = !showFpsCounter;
            console.debug("FPS counter visibility toggled:", showFpsCounter);
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

    // Start the unified game loop
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoopId = requestAnimationFrame(draw);

    console.debug("Game initialized. Initial state: menuActive=", menuActive, "gameLoopId=", gameLoopId);

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
        paddle.speed = DEFAULT_PADDLE_SPEED; // Original paddle speed

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

    function drawGameBorders() {
        ctx.save();

        // Draw game area border
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = BORDER_THICKNESS;
        ctx.strokeRect(
            gameBorder.left - BORDER_THICKNESS / 2,
            gameBorder.top - BORDER_THICKNESS / 2,
            gameBorder.right - gameBorder.left + BORDER_THICKNESS,
            gameBorder.bottom - gameBorder.top + BORDER_THICKNESS
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
                canvas.height - BORDER_THICKNESS / 2,
                gameBorder.right - gameBorder.left,
                0
            );
            ctx.setLineDash([]); // Reset line style
        }

        ctx.restore();
    }

    // Fixed time step variables
    const FIXED_TIME_STEP = 1 / 60; // 60 updates per second
    let accumulator = 0;
    let lastTime = 0;
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let currentFps = 0;
    let showFpsCounter = false; // New variable to control FPS counter visibility

    // Cache for frequently used values
    const cachedValues = {
        sin: {},
        cos: {},
        gradients: {}
    };

    // Function to get cached sine value
    function getSin(angle) {
        const key = angle.toFixed(2);
        if (!cachedValues.sin[key]) {
            cachedValues.sin[key] = Math.sin(angle);
        }
        return cachedValues.sin[key];
    }

    // Function to get cached cosine value
    function getCos(angle) {
        const key = angle.toFixed(2);
        if (!cachedValues.cos[key]) {
            cachedValues.cos[key] = Math.cos(angle);
        }
        return cachedValues.cos[key];
    }

    // Function to get cached gradient
    function getGradient(ctx, x0, y0, x1, y1, stops) {
        const key = `${x0},${y0},${x1},${y1},${stops.join(',')}`;
        if (!cachedValues.gradients[key]) {
            const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            stops.forEach((stop, i) => gradient.addColorStop(i / (stops.length - 1), stop));
            cachedValues.gradients[key] = gradient;
        }
        return cachedValues.gradients[key];
    }

    function updatePhysics(deltaTime) {
        // Update power-ups timers
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
            if (powerUpTimers.invincible <= 0) {
                activePowerUps.invincible = false;
                powerUpBarAlpha.invincible = 0;
            }
        }
        if (activePowerUps.fireBall) {
            powerUpTimers.fireBall -= deltaTime;
            if (powerUpTimers.fireBall <= 0) {
                activePowerUps.fireBall = false;
                bottomBorderBlink = false;
            }
        }
        if (activePowerUps.doubleSize) {
            powerUpTimers.doubleSize -= deltaTime;
            if (powerUpTimers.doubleSize <= 0) {
                activePowerUps.doubleSize = false;
                bottomBorderBlink = false;
            }
        }
        if (activePowerUps.laser) {
            powerUpTimers.laser -= deltaTime;
            if (powerUpTimers.laser <= 0) {
                activePowerUps.laser = false;
                powerUpBarAlpha.laser = 0;
                laserShots = []; // Limpiar todos los láseres activos
            }
        }

        // Update paddle position
        if (!isPaddleDestroyed) {
            if (rightPressed && paddle.x < gameBorder.right - paddle.width) {
                paddle.x += paddle.speed;
            } else if (leftPressed && paddle.x > gameBorder.left) {
                paddle.x -= paddle.speed;
            }
        }

        // Update ball positions and handle collisions
        for (let ball of balls) {
            if (!ball.onPad) {
                ball.x += ball.dx;
                ball.y += ball.dy;
            }
        }

        // Handle collisions
        checkGamepad();
        collisionDetection();
        handleWallCollisions();
        updatePowerUps();

        // Update power-up rotation
        powerUpAngle += 0.05;
    }

    function draw() {
        // Calculate deltaTime in seconds
        const now = performance.now();
        let deltaTime = (now - lastTime) / 1000;
        if (deltaTime > 0.1) deltaTime = 0.1; // Limit to 0.1s per frame
        lastTime = now;

        // Update FPS counter
        frameCount++;
        if (now - lastFpsUpdate >= 1000) {
            currentFps = frameCount;
            frameCount = 0;
            lastFpsUpdate = now;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (menuActive) {
            // Draw menu state
            drawMenu();
        } else {
            // Game state logic
            // Only update physics if not paused and not showing messages
            if (!paused && !showLevelMessage && !showGameOver) {
                // Accumulate time
                accumulator += deltaTime;

                // Update physics with fixed time step
                while (accumulator >= FIXED_TIME_STEP) {
                    updatePhysics(FIXED_TIME_STEP);
                    accumulator -= FIXED_TIME_STEP;
                }
            }

            // Draw game state
            drawBricks();
            drawGameBorders();
            for (let ball of balls) {
                drawBall(ball);
            }
            updateAndDrawParticles();
            updateAndDrawLasers();
            drawPaddle();
            drawScore();
            drawLives();
            drawPowerUps();
            drawPowerUpBars();

            // Draw FPS counter (debug) only if enabled
            if (showFpsCounter) {
                ctx.save();
                ctx.font = '12px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                ctx.fillText(`FPS: ${currentFps}`, 10, 20);
                ctx.restore();
            }

            if (paused) {
                drawPause();
                gameLoopId = requestAnimationFrame(draw);
                return;
            }

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
                // Update ball position to follow paddle
                for (let ball of balls) {
                    ball.x = paddle.x + paddle.width / 2;
                    ball.y = paddle.y - ball.radius;
                }
                gameLoopId = requestAnimationFrame(draw);
                return;
            }
        }

        // Request next frame
        gameLoopId = requestAnimationFrame(draw);
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
            ballSpeed: Math.sqrt(balls[0].dx * balls[0].dx + balls[0].dy * balls[0].dy)
        });
    }

    function returnToMenu() {
        console.debug("Starting returnToMenu(). Initial state: menuActive=", menuActive, "currentLevel=", currentLevel);

        // 1. COMPLETELY STOP THE GAME AND ALL TIMERS
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

        // Start unified game loop
        gameLoopId = requestAnimationFrame(draw);

        console.debug("Menu activated. Final state: menuActive=", menuActive,
            "gameLoopId=", gameLoopId,
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
        paddle.speed = DEFAULT_PADDLE_SPEED;
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
        const asciiLevel = levels[levelIdx].map(row => row.padEnd(BRICK_COLUMN_COUNT, ' '));
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
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
        paddle.speed = DEFAULT_PADDLE_SPEED;

        // Reset music
        backgroundMusic.playbackRate = 1.0;

        // Set up automatic launch
        waitingToLaunch = true;
        if (launchTimeout) clearTimeout(launchTimeout);
        launchTimeout = setTimeout(launchBall, 3000);

        console.debug('Level loaded with ' + bricks.flat().filter(b => b.status === 1 && !b.indestructible).length + ' active destructible blocks');
    }

    // Variables para el power-up de láser
    let laserShots = [];
    const LASER_SPEED = 12;
    const LASER_WIDTH = 4;
    const LASER_HEIGHT = 20;
    const LASER_COOLDOWN = 200; // ms between shots
    let lastLaserShot = 0;
    const LASER_DURATION = 5; // seconds of power-up duration

    // Function to create a laser shot
    function createLaserShot(x, y) {
        return {
            x: x,
            y: y,
            width: LASER_WIDTH,
            height: LASER_HEIGHT,
            speed: LASER_SPEED
        };
    }

    // Function to update and draw laser shots
    function updateAndDrawLasers() {
        for (let i = laserShots.length - 1; i >= 0; i--) {
            const laser = laserShots[i];
            
            // Move laser upwards
            laser.y -= laser.speed;
            
            // Remove if it exits the screen
            if (laser.y + laser.height < gameBorder.top) {
                laserShots.splice(i, 1);
                continue;
            }
            
            // Draw laser with visual effects
            ctx.save();
            
            // Gradient for the laser
            const gradient = ctx.createLinearGradient(laser.x, laser.y, laser.x, laser.y + laser.height);
            gradient.addColorStop(0, 'rgba(233, 30, 99, 0.8)'); // Pink
            gradient.addColorStop(0.5, 'rgba(233, 30, 99, 1)'); // Pink
            gradient.addColorStop(1, 'rgba(233, 30, 99, 0.8)'); // Pink
            
            // Glow effect
            ctx.shadowColor = 'rgba(233, 30, 99, 0.5)'; // Pink
            ctx.shadowBlur = 10;
            
            // Draw the laser
            ctx.fillStyle = gradient;
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
            
            // Glow effect
            ctx.strokeStyle = 'rgba(233, 30, 99, 0.3)'; // Pink
            ctx.lineWidth = 2;
            ctx.strokeRect(laser.x - 1, laser.y, laser.width + 2, laser.height);
            
            ctx.restore();
            
            // Check collisions with blocks
            for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
                for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                    const brick = bricks[c][r];
                    if (brick.status === 1) { // Check all active blocks
                        if (laser.x < brick.x + BRICK_WIDTH &&
                            laser.x + laser.width > brick.x &&
                            laser.y < brick.y + BRICK_HEIGHT &&
                            laser.y + laser.height > brick.y) {
                            
                            // If block is indestructible, just remove the laser
                            if (brick.indestructible) {
                                laserShots.splice(i, 1);
                                break;
                            }
                            
                            // If not indestructible, destroy the block
                            brick.status = 0;
                            score++;
                            audioBrick.currentTime = 0;
                            audioBrick.play();
                            createBrickExplosion(brick);
                            spawnPowerUp(brick.x + BRICK_WIDTH / 2 - 14, brick.y + BRICK_HEIGHT / 2 - 14);
                            
                            // Remove the laser
                            laserShots.splice(i, 1);

                            // Verificar completación del nivel
                            checkLevelCompletion();
                            
                            break;
                        }
                    }
                }
            }
        }
    }

    // Function to generate animation pattern
    function generateAnimationPattern() {
        const pattern = Math.floor(Math.random() * ANIMATION_PATTERNS);
        const duration = MIN_ANIMATION_DURATION + Math.random() * (MAX_ANIMATION_DURATION - MIN_ANIMATION_DURATION);
        const intensity = 0.3 + Math.random() * 0.7;
        
        return {
            pattern,
            duration,
            intensity,
            startTime: Date.now()
        };
    }

    // Function to calculate animation intensity
    function calculateAnimationIntensity(block) {
        const elapsed = Date.now() - block.startTime;
        const progress = elapsed / block.duration;
        
        if (progress >= 1) return 0;
        
        // Cache frequently used values
        const sinProgress = getSin(progress * Math.PI);
        const sinProgress2 = getSin(progress * Math.PI * 2);
        const sinProgress4 = getSin(progress * Math.PI * 4);
        
        switch (block.pattern) {
            case 0: // Soft pulse
                return block.intensity * (0.5 + 0.5 * sinProgress2);
            case 1: // Fade in/out
                return block.intensity * sinProgress;
            case 2: // Fast pulse
                return block.intensity * (0.3 + 0.7 * Math.abs(sinProgress4));
            case 3: // Wave
                return block.intensity * (0.5 + 0.5 * getSin(progress * Math.PI + block.c * 0.3));
            default:
                return 0;
        }
    }
}); 
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface RenderBall {
    x: number;
    y: number;
    radius: number;
}

export interface RenderPaddle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RenderBrick {
    x: number;
    y: number;
    status: number;
    hits: number;
    indestructible: boolean;
    color: string;
}

export interface RenderPowerUp {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    type: string;
}

export interface RenderLaser {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RenderEnemy {
    x: number;
    y: number;
    angle: number;
    isDestroying: boolean;
    destroyTime: number;
    impactTime?: number;
    impactKind?: 'ball' | 'paddle' | null;
    originalSize: number;
    type: {
        shape: 'circle' | 'triangle' | 'square' | 'hexagon';
        color: string;
        size: number;
    };
}

export interface ThreeRenderState {
    currentLevel: number;
    balls: RenderBall[];
    paddle: RenderPaddle;
    bricks: RenderBrick[][];
    powerUps: RenderPowerUp[];
    laserShots: RenderLaser[];
    enemies: RenderEnemy[];
    activePowerUps: {
        invincible: boolean;
        fireBall: boolean;
        doubleSize: boolean;
        laser: boolean;
    };
    powerUpAngle: number;
    isPaddleDestroyed: boolean;
    gameBorder: {
        top: number;
        left: number;
        right: number;
        bottom: number;
    };
}

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
const BRICK_WIDTH = 64;
const BRICK_HEIGHT = 24;
const MAX_BRICKS = 300;
const MAX_BALLS = 12;
const MAX_POWER_UPS = 4;
const MAX_LASERS = 24;
const MAX_ENEMIES = 4;
const LEVEL_PALETTES = [
    { top: 0x07182d, bottom: 0x02040b, accent: 0x00bfff, board: 0x0b1728 },
    { top: 0x20103b, bottom: 0x07030f, accent: 0xc34cff, board: 0x1a102a },
    { top: 0x102d29, bottom: 0x020b0a, accent: 0x2fffc1, board: 0x0b211f },
    { top: 0x3a1710, bottom: 0x0d0402, accent: 0xff7a2f, board: 0x29130d },
    { top: 0x29102c, bottom: 0x09020b, accent: 0xff3f9f, board: 0x210d25 },
    { top: 0x152746, bottom: 0x020711, accent: 0x5d8cff, board: 0x0d1b35 }
];

interface BrickStyle {
    color: number;
    emissive: number;
    metalness: number;
}

interface BrickLayer {
    body: THREE.InstancedMesh;
    face: THREE.InstancedMesh;
    count: number;
}

interface EnemyVisual {
    group: THREE.Group;
    body: THREE.Mesh;
    outline: THREE.LineSegments;
    halo: THREE.Mesh;
    core: THREE.Mesh;
    ring: THREE.Mesh;
    satellites: THREE.Mesh[];
    shape: RenderEnemy['type']['shape'] | null;
    size: number;
}

interface PowerUpVisual {
    group: THREE.Group;
    body: THREE.Mesh;
    face: THREE.Mesh;
    rim: THREE.LineSegments;
    glow: THREE.Mesh;
}

const BRICK_STYLES: Record<string, BrickStyle> = {
    white: { color: 0xe8f7ff, emissive: 0x4f91ad, metalness: 0.28 },
    yellow: { color: 0xffd83d, emissive: 0xa65b00, metalness: 0.2 },
    red: { color: 0xff4f64, emissive: 0xa6082f, metalness: 0.2 },
    green: { color: 0x55e982, emissive: 0x087a3d, metalness: 0.18 },
    orange: { color: 0xff9d3d, emissive: 0xa63d00, metalness: 0.2 },
    purple: { color: 0xc85cff, emissive: 0x6510a3, metalness: 0.22 },
    reinforced: { color: 0xaebdca, emissive: 0x263c50, metalness: 0.72 },
    damaged: { color: 0xd9e2e8, emissive: 0x455a64, metalness: 0.58 },
    indestructible: { color: 0x29e8ff, emissive: 0x007e9d, metalness: 0.48 }
};

function createBeveledBox(width: number, height: number, depth: number, bevel: number): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 1,
        bevelSize: bevel,
        bevelThickness: bevel,
        curveSegments: 1
    });
    geometry.translate(0, 0, -depth / 2);
    geometry.computeVertexNormals();
    return geometry;
}

function createCapsuleGeometry(width: number, height: number, depth: number): THREE.ExtrudeGeometry {
    const radius = height / 2;
    const halfStraight = width / 2 - radius;
    const shape = new THREE.Shape();
    shape.moveTo(-halfStraight, -radius);
    shape.lineTo(halfStraight, -radius);
    shape.absarc(halfStraight, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-halfStraight, radius);
    shape.absarc(-halfStraight, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 2,
        bevelThickness: 2,
        curveSegments: 8
    });
    geometry.translate(0, 0, -depth / 2);
    geometry.computeVertexNormals();
    return geometry;
}

function createPaddleHull(): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-80, -11);
    shape.lineTo(-65, -18);
    shape.lineTo(-28, -15);
    shape.lineTo(-18, -8);
    shape.lineTo(18, -8);
    shape.lineTo(28, -15);
    shape.lineTo(65, -18);
    shape.lineTo(80, -11);
    shape.lineTo(74, 10);
    shape.lineTo(32, 15);
    shape.lineTo(19, 9);
    shape.lineTo(-19, 9);
    shape.lineTo(-32, 15);
    shape.lineTo(-74, 10);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 28,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 4,
        bevelThickness: 4,
        curveSegments: 1
    });
    geometry.translate(0, 0, -14);
    geometry.computeVertexNormals();
    return geometry;
}

function brickStyleKey(brick: RenderBrick): string {
    if (brick.indestructible) return 'indestructible';
    if (brick.color === '2') return brick.hits === 1 ? 'damaged' : 'reinforced';
    switch (brick.color) {
        case 'Y': return 'yellow';
        case 'R': return 'red';
        case 'G': return 'green';
        case 'O': return 'orange';
        case 'P': return 'purple';
        case '#': return 'indestructible';
        default: return 'white';
    }
}

export class ThreeGameRenderer {
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene = new THREE.Scene();
    private readonly camera: THREE.PerspectiveCamera;
    private readonly composer: EffectComposer | null;
    private readonly clock = new THREE.Clock();
    private readonly brickLayers = new Map<string, BrickLayer>();
    private readonly ballMeshes: THREE.Mesh[] = [];
    private readonly ballHalos: THREE.Mesh[] = [];
    private readonly powerUpVisuals: PowerUpVisual[] = [];
    private readonly powerUpLabels: THREE.Mesh[] = [];
    private readonly laserMeshes: THREE.Mesh[] = [];
    private readonly enemyVisuals: EnemyVisual[] = [];
    private readonly enemyGeometries = new Map<string, THREE.BufferGeometry>();
    private readonly powerUpTextures = new Map<string, THREE.CanvasTexture>();
    private readonly barrier: THREE.Mesh;
    private readonly paddle: THREE.Mesh;
    private readonly paddleCannons: THREE.Mesh[] = [];
    private readonly paddleEngineGlows: THREE.Mesh[] = [];
    private paddleCore!: THREE.Mesh;
    private paddleLightStrip!: THREE.Mesh;
    private backdropMaterial!: THREE.ShaderMaterial;
    private boardMaterial!: THREE.MeshPhysicalMaterial;
    private stars!: THREE.Points;
    private starSpeeds = new Float32Array(0);
    private readonly temporaryMatrix = new THREE.Matrix4();
    private elapsed = 0;

    constructor(overlayCanvas: HTMLCanvasElement) {
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const renderPixelRatio = isMobile
            ? Math.min(devicePixelRatio, 1.35)
            : Math.min(Math.max(devicePixelRatio, 1.5), 1.75);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(renderPixelRatio);
        this.renderer.setSize(LOGICAL_WIDTH, LOGICAL_HEIGHT, false);
        this.renderer.setClearColor(0x02050c, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.45;
        this.renderer.domElement.id = 'gameWebGLCanvas';
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        overlayCanvas.parentElement?.insertBefore(this.renderer.domElement, overlayCanvas);

        this.camera = new THREE.PerspectiveCamera(36, LOGICAL_WIDTH / LOGICAL_HEIGHT, 1, 3000);
        this.camera.position.set(680, 420, 1300);
        this.camera.lookAt(620, 350, 0);

        this.addEnvironment();

        this.createBrickLayers();

        this.paddle = new THREE.Mesh(
            createPaddleHull(),
            new THREE.MeshPhysicalMaterial({
                color: 0x168fc5,
                emissive: 0x003e67,
                emissiveIntensity: 1.15,
                metalness: 0.78,
                roughness: 0.18,
                clearcoat: 1,
                clearcoatRoughness: 0.1
            })
        );
        this.addPaddleDetails();
        this.scene.add(this.paddle);

        const cannonGeometry = new THREE.CylinderGeometry(4, 5, 18, 8);
        const cannonMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3d92,
            emissive: 0xff176c,
            emissiveIntensity: 1.8,
            roughness: 0.25
        });
        for (let index = 0; index < 2; index++) {
            const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
            cannon.rotation.x = Math.PI / 2;
            cannon.position.set(index === 0 ? -48 : 48, 12, 17);
            cannon.visible = false;
            this.paddleCannons.push(cannon);
            this.paddle.add(cannon);
        }

        this.barrier = new THREE.Mesh(
            createBeveledBox(100, 8, 10, 2),
            new THREE.MeshBasicMaterial({
                color: 0x00ffe0,
                transparent: true,
                opacity: 0.75
            })
        );
        this.barrier.visible = false;
        this.scene.add(this.barrier);

        this.createPools();
        if (!isMobile && !reducedMotion) {
            this.composer = new EffectComposer(this.renderer);
            this.composer.setPixelRatio(renderPixelRatio);
            this.composer.setSize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
            this.composer.addPass(new RenderPass(this.scene, this.camera));
            this.composer.addPass(new UnrealBloomPass(
                new THREE.Vector2(LOGICAL_WIDTH, LOGICAL_HEIGHT),
                0.52,
                0.34,
                0.76
            ));
            this.composer.addPass(new SMAAPass());
        } else {
            this.composer = null;
        }
        this.setVisible(false);
    }

    setVisible(visible: boolean): void {
        this.renderer.domElement.style.display = visible ? 'block' : 'none';
    }

    resize(cssWidth: number, cssHeight: number, left: number, top: number): void {
        const canvas = this.renderer.domElement;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        canvas.style.left = `${left}px`;
        canvas.style.top = `${top}px`;
    }

    render(state: ThreeRenderState): void {
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        this.elapsed += deltaTime;
        this.syncEnvironment(state.currentLevel, deltaTime);
        this.syncBricks(state);
        this.syncPaddle(state);
        this.syncBalls(state);
        this.syncPowerUps(state);
        this.syncLasers(state);
        this.syncEnemies(state);
        this.syncBarrier(state);
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    projectGamePoint(x: number, y: number, z = 14): { x: number; y: number } {
        this.camera.updateMatrixWorld();
        const projected = new THREE.Vector3(x, LOGICAL_HEIGHT - y, z).project(this.camera);
        return {
            x: (projected.x * 0.5 + 0.5) * LOGICAL_WIDTH,
            y: (-projected.y * 0.5 + 0.5) * LOGICAL_HEIGHT
        };
    }

    private addEnvironment(): void {
        this.scene.fog = new THREE.FogExp2(0x02050c, 0.00075);

        this.backdropMaterial = new THREE.ShaderMaterial({
            depthWrite: false,
            uniforms: {
                topColor: { value: new THREE.Color(0x07182d) },
                bottomColor: { value: new THREE.Color(0x02040b) },
                accentColor: { value: new THREE.Color(0x00bfff) },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform vec3 accentColor;
                uniform float time;
                varying vec2 vUv;
                void main() {
                    float radial = max(0.0, 1.0 - distance(vUv, vec2(0.42, 0.58)));
                    float waves = 0.5 + 0.5 * sin(vUv.x * 18.0 + vUv.y * 9.0 + time * 0.22);
                    float veil = 0.5 + 0.5 * sin(vUv.x * 6.0 - vUv.y * 14.0 - time * 0.14);
                    vec3 gradient = mix(bottomColor, topColor, vUv.y);
                    gradient += accentColor * radial * radial * (0.055 + waves * 0.045 + veil * 0.025);
                    gl_FragColor = vec4(gradient, 1.0);
                }
            `
        });
        const backdrop = new THREE.Mesh(
            new THREE.PlaneGeometry(1500, 900),
            this.backdropMaterial
        );
        backdrop.position.set(640, 360, -120);
        this.scene.add(backdrop);

        this.boardMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0b1728,
            emissive: 0x031126,
            emissiveIntensity: 1.15,
            roughness: 0.4,
            metalness: 0.35,
            clearcoat: 0.45
        });
        const board = new THREE.Mesh(createBeveledBox(1032, 696, 22, 9), this.boardMaterial);
        board.position.set(540, 360, -28);
        this.scene.add(board);

        const sidePanel = new THREE.Mesh(
            new THREE.PlaneGeometry(176, 696),
            new THREE.MeshBasicMaterial({ color: 0x050b14, transparent: true, opacity: 0.72 })
        );
        sidePanel.position.set(1168, 360, -42);
        this.scene.add(sidePanel);

        this.addArenaGrid();

        const wallMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0b75a5,
            emissive: 0x00b8ff,
            emissiveIntensity: 1.15,
            metalness: 0.48,
            roughness: 0.3,
            clearcoat: 0.72,
            clearcoatRoughness: 0.22
        });
        const leftWall = new THREE.Mesh(new RoundedBoxGeometry(18, 696, 36, 5, 4), wallMaterial);
        leftWall.position.set(24, 360, 24);
        this.scene.add(leftWall);
        const rightWall = leftWall.clone();
        rightWall.position.x = 1056;
        this.scene.add(rightWall);
        const topWall = new THREE.Mesh(new RoundedBoxGeometry(1032, 18, 36, 5, 4), wallMaterial);
        topWall.position.set(540, LOGICAL_HEIGHT - 24, 24);
        this.scene.add(topWall);

        const innerRailMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x8beaff,
            emissive: 0x16cfff,
            emissiveIntensity: 1.45,
            metalness: 0.58,
            roughness: 0.24,
            clearcoat: 0.8,
            clearcoatRoughness: 0.18
        });
        const leftRail = new THREE.Mesh(new RoundedBoxGeometry(4, 672, 42, 4, 1.5), innerRailMaterial);
        leftRail.position.set(34, 348, 30);
        this.scene.add(leftRail);
        const rightRail = leftRail.clone();
        rightRail.position.x = 1046;
        this.scene.add(rightRail);
        const topRail = new THREE.Mesh(new RoundedBoxGeometry(1012, 4, 42, 4, 1.5), innerRailMaterial);
        topRail.position.set(540, 686, 30);
        this.scene.add(topRail);

        this.scene.add(new THREE.HemisphereLight(0xb9ecff, 0x080411, 2.8));
        const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
        keyLight.position.set(220, 720, 650);
        this.scene.add(keyLight);
        const neonLight = new THREE.PointLight(0x00bfff, 310, 900, 1.7);
        neonLight.position.set(340, 520, 260);
        this.scene.add(neonLight);
        const accentLight = new THREE.PointLight(0xff237e, 250, 750, 1.8);
        accentLight.position.set(920, 180, 220);
        this.scene.add(accentLight);

        const starCount = 180;
        const positions = new Float32Array(starCount * 3);
        this.starSpeeds = new Float32Array(starCount);
        for (let index = 0; index < starCount; index++) {
            positions[index * 3] = Math.random() * LOGICAL_WIDTH;
            positions[index * 3 + 1] = Math.random() * LOGICAL_HEIGHT;
            positions[index * 3 + 2] = -80 - Math.random() * 180;
            this.starSpeeds[index] = 7 + Math.random() * 20;
        }
        const starsGeometry = new THREE.BufferGeometry();
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.stars = new THREE.Points(
            starsGeometry,
            new THREE.PointsMaterial({
                color: 0x8bdcff,
                size: 2.2,
                transparent: true,
                opacity: 0.7,
                sizeAttenuation: false
            })
        );
        this.scene.add(this.stars);
    }

    private syncEnvironment(level: number, deltaTime: number): void {
        const palette = LEVEL_PALETTES[level % LEVEL_PALETTES.length];
        const blend = 1 - Math.pow(0.015, deltaTime);
        const topColor = this.backdropMaterial.uniforms.topColor.value as THREE.Color;
        const bottomColor = this.backdropMaterial.uniforms.bottomColor.value as THREE.Color;
        const accentColor = this.backdropMaterial.uniforms.accentColor.value as THREE.Color;
        topColor.lerp(new THREE.Color(palette.top), blend);
        bottomColor.lerp(new THREE.Color(palette.bottom), blend);
        accentColor.lerp(new THREE.Color(palette.accent), blend);
        this.backdropMaterial.uniforms.time.value = this.elapsed;
        this.boardMaterial.color.lerp(new THREE.Color(palette.board), blend * 0.5);
        this.boardMaterial.emissive.lerp(new THREE.Color(palette.accent).multiplyScalar(0.08), blend * 0.5);
        this.scene.fog?.color.lerp(new THREE.Color(palette.bottom), blend);

        const starMaterial = this.stars.material as THREE.PointsMaterial;
        starMaterial.color.lerp(new THREE.Color(palette.accent).lerp(new THREE.Color(0xffffff), 0.35), blend);
        const positionAttribute = this.stars.geometry.getAttribute('position') as THREE.BufferAttribute;
        const positions = positionAttribute.array as Float32Array;
        for (let index = 0; index < this.starSpeeds.length; index++) {
            const offset = index * 3;
            positions[offset] += this.starSpeeds[index] * deltaTime * 0.18;
            positions[offset + 1] -= this.starSpeeds[index] * deltaTime;
            if (positions[offset + 1] < -20) {
                positions[offset + 1] = LOGICAL_HEIGHT + Math.random() * 90;
                positions[offset] = Math.random() * LOGICAL_WIDTH;
            }
            if (positions[offset] > LOGICAL_WIDTH + 20) positions[offset] = -20;
        }
        positionAttribute.needsUpdate = true;
        this.stars.rotation.z = Math.sin(this.elapsed * 0.025) * 0.018;
    }

    private createBrickLayers(): void {
        const bodyGeometry = createBeveledBox(BRICK_WIDTH - 4, BRICK_HEIGHT - 4, 18, 2.5);
        const faceGeometry = createBeveledBox(BRICK_WIDTH - 12, BRICK_HEIGHT - 11, 3, 1.5);

        for (const [key, style] of Object.entries(BRICK_STYLES)) {
            const body = new THREE.InstancedMesh(
                bodyGeometry,
                new THREE.MeshPhysicalMaterial({
                    color: style.color,
                    emissive: style.emissive,
                    emissiveIntensity: key === 'indestructible' ? 1.25 : 0.72,
                    roughness: 0.22,
                    metalness: style.metalness,
                    clearcoat: 0.9,
                    clearcoatRoughness: 0.16,
                    flatShading: true
                }),
                MAX_BRICKS
            );
            body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            body.count = 0;
            this.scene.add(body);

            const faceColor = new THREE.Color(style.color).lerp(
                new THREE.Color(0xffffff),
                key === 'white' || key === 'damaged' ? 0.12 : 0.26
            );
            const face = new THREE.InstancedMesh(
                faceGeometry,
                new THREE.MeshBasicMaterial({
                    color: faceColor,
                    transparent: true,
                    opacity: key === 'white' || key === 'damaged' ? 0.66 : 0.78,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                }),
                MAX_BRICKS
            );
            face.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            face.count = 0;
            this.scene.add(face);

            this.brickLayers.set(key, { body, face, count: 0 });
        }
    }

    private addArenaGrid(): void {
        const positions: number[] = [];
        for (let x = 48; x < 1040; x += 48) {
            positions.push(x, 28, -14, x, 692, -14);
        }
        for (let y = 48; y < 696; y += 48) {
            positions.push(32, y, -14, 1048, y, -14);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const grid = new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({
                color: 0x129bd0,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(grid);
    }

    private addPaddleDetails(): void {
        const wingMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x4fcfff,
            emissive: 0x006fa3,
            emissiveIntensity: 1.05,
            metalness: 0.68,
            roughness: 0.14,
            clearcoat: 1
        });
        const wingGeometry = createBeveledBox(38, 13, 18, 3);

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-68, 1, 9);
        leftWing.rotation.z = -0.12;
        this.paddle.add(leftWing);

        const rightWing = leftWing.clone();
        rightWing.position.x = 68;
        rightWing.rotation.z = 0.12;
        this.paddle.add(rightWing);

        this.paddleCore = new THREE.Mesh(
            createCapsuleGeometry(54, 16, 9),
            new THREE.MeshPhysicalMaterial({
                color: 0xd9f8ff,
                emissive: 0x18c8ff,
                emissiveIntensity: 1.55,
                metalness: 0.35,
                roughness: 0.08,
                clearcoat: 1
            })
        );
        this.paddleCore.position.set(0, 5, 18);
        this.paddle.add(this.paddleCore);

        this.paddleLightStrip = new THREE.Mesh(
            createCapsuleGeometry(116, 4, 3),
            new THREE.MeshBasicMaterial({
                color: 0x9af4ff,
                transparent: true,
                opacity: 0.92,
                blending: THREE.AdditiveBlending
            })
        );
        this.paddleLightStrip.position.set(0, 13, 17);
        this.paddle.add(this.paddleLightStrip);

        const engineMaterial = new THREE.MeshBasicMaterial({
            color: 0x7df9ff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        for (const x of [-55, 55]) {
            const engine = new THREE.Mesh(new THREE.CircleGeometry(10, 20), engineMaterial.clone());
            engine.position.set(x, -17, 17);
            engine.scale.set(1.3, 0.7, 1);
            this.paddleEngineGlows.push(engine);
            this.paddle.add(engine);
        }

        const edgeGeometry = new THREE.EdgesGeometry(this.paddle.geometry, 25);
        const edge = new THREE.LineSegments(
            edgeGeometry,
            new THREE.LineBasicMaterial({
                color: 0x9defff,
                transparent: true,
                opacity: 0.68
            })
        );
        this.paddle.add(edge);
    }

    private createPools(): void {
        const ballGeometry = new THREE.IcosahedronGeometry(8, 2);
        const haloGeometry = new THREE.CircleGeometry(18, 24);
        for (let index = 0; index < MAX_BALLS; index++) {
            const ball = new THREE.Mesh(
                ballGeometry,
                new THREE.MeshStandardMaterial({
                    color: 0xdff8ff,
                    emissive: 0x58cfff,
                    emissiveIntensity: 1.5,
                    metalness: 0.5,
                    roughness: 0.12
                })
            );
            ball.visible = false;
            this.ballMeshes.push(ball);
            this.scene.add(ball);

            const halo = new THREE.Mesh(
                haloGeometry,
                new THREE.MeshBasicMaterial({
                    color: 0x63dcff,
                    transparent: true,
                    opacity: 0.14,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            halo.visible = false;
            this.ballHalos.push(halo);
            this.scene.add(halo);
        }

        const powerUpGeometry = createCapsuleGeometry(58, 25, 16);
        const powerUpFaceGeometry = createCapsuleGeometry(48, 15, 3);
        const powerUpGlowGeometry = new THREE.CircleGeometry(35, 28);
        const powerUpLabelGeometry = new THREE.PlaneGeometry(42, 21);
        for (let index = 0; index < MAX_POWER_UPS; index++) {
            const group = new THREE.Group();
            const body = new THREE.Mesh(
                powerUpGeometry,
                new THREE.MeshStandardMaterial({
                    color: 0x707070,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.82,
                    metalness: 0.1,
                    roughness: 0.5
                })
            );
            const face = new THREE.Mesh(
                powerUpFaceGeometry,
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.5,
                    depthWrite: false
                })
            );
            face.position.z = 10;
            const rim = new THREE.LineSegments(
                new THREE.EdgesGeometry(powerUpGeometry, 24),
                new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.72
                })
            );
            const glow = new THREE.Mesh(
                powerUpGlowGeometry,
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.18,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            glow.position.z = -6;
            glow.scale.set(1.4, 0.68, 1);
            group.add(body, face, rim);
            group.visible = false;
            this.powerUpVisuals.push({ group, body, face, rim, glow });
            glow.visible = false;
            this.scene.add(group, glow);

            const label = new THREE.Mesh(powerUpLabelGeometry, new THREE.MeshBasicMaterial({
                transparent: true,
                depthTest: true,
                depthWrite: false,
                side: THREE.FrontSide,
                polygonOffset: true,
                polygonOffsetFactor: -1
            }));
            label.position.z = 12;
            label.visible = false;
            this.powerUpLabels.push(label);
            group.add(label);
        }

        const laserGeometry = createBeveledBox(5, 22, 8, 1);
        const laserMaterial = new THREE.MeshBasicMaterial({ color: 0xff4da6 });
        for (let index = 0; index < MAX_LASERS; index++) {
            const laser = new THREE.Mesh(laserGeometry, laserMaterial);
            laser.visible = false;
            this.laserMeshes.push(laser);
            this.scene.add(laser);
        }

        for (let index = 0; index < MAX_ENEMIES; index++) {
            const group = new THREE.Group();
            const geometry = this.enemyGeometry('circle', 20);
            const body = new THREE.Mesh(
                geometry,
                new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.85,
                    metalness: 0.32,
                    roughness: 0.26,
                    clearcoat: 0.75,
                    clearcoatRoughness: 0.18,
                    flatShading: true,
                    transparent: true
                })
            );
            const outline = new THREE.LineSegments(
                new THREE.EdgesGeometry(geometry, 28),
                new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
            );
            const halo = new THREE.Mesh(
                new THREE.CircleGeometry(28, 24),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            halo.position.z = -5;
            const core = new THREE.Mesh(
                new THREE.CircleGeometry(8, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            core.position.z = 12;
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(14, 1.6, 6, 24),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            ring.position.z = 13;
            const satellites: THREE.Mesh[] = [];
            for (let satelliteIndex = 0; satelliteIndex < 3; satelliteIndex++) {
                const satellite = new THREE.Mesh(
                    new THREE.OctahedronGeometry(2.8, 0),
                    new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        blending: THREE.AdditiveBlending
                    })
                );
                satellite.position.z = 13;
                satellites.push(satellite);
                group.add(satellite);
            }
            group.add(halo, body, outline, core, ring);
            group.visible = false;
            this.enemyVisuals.push({
                group,
                body,
                outline,
                halo,
                core,
                ring,
                satellites,
                shape: null,
                size: 0
            });
            this.scene.add(group);
        }
    }

    private syncBricks(state: ThreeRenderState): void {
        for (const layer of this.brickLayers.values()) {
            layer.count = 0;
        }

        for (const column of state.bricks) {
            for (const brick of column || []) {
                if ((!brick || brick.status !== 1) && !brick?.indestructible) continue;
                const layer = this.brickLayers.get(brickStyleKey(brick));
                if (!layer || layer.count >= MAX_BRICKS) continue;

                this.temporaryMatrix.makeTranslation(
                    brick.x + BRICK_WIDTH / 2,
                    LOGICAL_HEIGHT - brick.y - BRICK_HEIGHT / 2,
                    4
                );
                layer.body.setMatrixAt(layer.count, this.temporaryMatrix);
                this.temporaryMatrix.makeTranslation(
                    brick.x + BRICK_WIDTH / 2,
                    LOGICAL_HEIGHT - brick.y - BRICK_HEIGHT / 2,
                    14
                );
                layer.face.setMatrixAt(layer.count, this.temporaryMatrix);
                layer.count++;
            }
        }

        for (const layer of this.brickLayers.values()) {
            layer.body.count = layer.count;
            layer.face.count = layer.count;
            layer.body.instanceMatrix.needsUpdate = true;
            layer.face.instanceMatrix.needsUpdate = true;
        }
    }

    private syncPaddle(state: ThreeRenderState): void {
        const { paddle } = state;
        this.paddle.visible = !state.isPaddleDestroyed;
        this.paddle.position.set(
            paddle.x + paddle.width / 2,
            LOGICAL_HEIGHT - paddle.y - paddle.height / 2,
            12
        );
        this.paddle.scale.set(paddle.width / 160, paddle.height / 28, 1);
        this.paddle.rotation.z = Math.sin(this.elapsed * 1.8) * 0.008;
        const enginePulse = 0.82 + Math.sin(this.elapsed * 11) * 0.18;
        this.paddleEngineGlows.forEach((engine, index) => {
            engine.scale.set(1.3 + enginePulse * 0.12, 0.55 + enginePulse * 0.2, 1);
            const material = engine.material as THREE.MeshBasicMaterial;
            material.opacity = 0.58 + enginePulse * 0.28;
            engine.position.y = -17 - Math.sin(this.elapsed * 13 + index) * 1.2;
        });
        this.paddleCore.scale.set(
            1 + Math.sin(this.elapsed * 4) * 0.025,
            1 + Math.sin(this.elapsed * 4) * 0.025,
            1
        );
        const stripMaterial = this.paddleLightStrip.material as THREE.MeshBasicMaterial;
        stripMaterial.opacity = 0.72 + Math.sin(this.elapsed * 6) * 0.18;

        const showCannons = state.activePowerUps.laser && !state.isPaddleDestroyed;
        this.paddleCannons.forEach((cannon) => {
            cannon.visible = showCannons;
        });
    }

    private syncBalls(state: ThreeRenderState): void {
        this.ballMeshes.forEach((mesh, index) => {
            const ball = state.balls[index];
            const halo = this.ballHalos[index];
            mesh.visible = Boolean(ball);
            halo.visible = Boolean(ball);
            if (!ball) return;

            const radius = ball.radius * (state.activePowerUps.doubleSize ? 2 : 1);
            mesh.position.set(ball.x, LOGICAL_HEIGHT - ball.y, 20);
            mesh.scale.setScalar(radius / 8);
            mesh.rotation.x = this.elapsed * 2.4;
            mesh.rotation.y = this.elapsed * 3.1;

            const material = mesh.material as THREE.MeshStandardMaterial;
            material.color.set(state.activePowerUps.fireBall ? 0xffb11b : 0xdff8ff);
            material.emissive.set(state.activePowerUps.fireBall ? 0xff3300 : 0x58cfff);
            material.emissiveIntensity = state.activePowerUps.fireBall ? 2.4 : 1.5;

            halo.position.set(ball.x, LOGICAL_HEIGHT - ball.y, 10);
            halo.scale.setScalar(radius / 8);
            const haloMaterial = halo.material as THREE.MeshBasicMaterial;
            haloMaterial.color.set(state.activePowerUps.fireBall ? 0xff5a12 : 0x63dcff);
            haloMaterial.opacity = state.activePowerUps.fireBall
                ? 0.13 + Math.sin(this.elapsed * 12 + index) * 0.035
                : 0.075 + Math.sin(this.elapsed * 12 + index) * 0.02;
        });
    }

    private syncPowerUps(state: ThreeRenderState): void {
        this.powerUpVisuals.forEach((visual, index) => {
            const powerUp = state.powerUps[index];
            const label = this.powerUpLabels[index];
            visual.group.visible = Boolean(powerUp);
            visual.glow.visible = Boolean(powerUp);
            if (!powerUp) return;

            const x = powerUp.x + powerUp.width / 2;
            const y = LOGICAL_HEIGHT - powerUp.y - powerUp.height / 2;
            const rollAngle = state.powerUpAngle * 2.15 + index * 0.85;
            visual.group.position.set(x, y, 20);
            visual.group.rotation.set(rollAngle, 0, 0);
            visual.glow.position.set(x, y, 8);

            const color = new THREE.Color(powerUp.color);
            const bodyMaterial = visual.body.material as THREE.MeshStandardMaterial;
            bodyMaterial.color.copy(color).multiplyScalar(0.52);
            bodyMaterial.emissive.copy(color).multiplyScalar(0.72);
            bodyMaterial.emissiveIntensity = 0.86;
            const faceMaterial = visual.face.material as THREE.MeshBasicMaterial;
            faceMaterial.color.copy(color).lerp(new THREE.Color(0xffffff), 0.28);
            const rimMaterial = visual.rim.material as THREE.LineBasicMaterial;
            rimMaterial.color.copy(color).lerp(new THREE.Color(0xffffff), 0.58);
            const glowMaterial = visual.glow.material as THREE.MeshBasicMaterial;
            glowMaterial.color.copy(color);
            glowMaterial.opacity = 0.052;
            visual.glow.scale.set(
                1.28,
                0.58,
                1
            );

            const labelMaterial = label.material as THREE.MeshBasicMaterial;
            labelMaterial.map = this.getPowerUpTexture(powerUp.type);
            labelMaterial.needsUpdate = true;
            label.visible = true;
        });
    }

    private syncLasers(state: ThreeRenderState): void {
        this.laserMeshes.forEach((mesh, index) => {
            const laser = state.laserShots[index];
            mesh.visible = Boolean(laser);
            if (!laser) return;
            mesh.position.set(
                laser.x + laser.width / 2,
                LOGICAL_HEIGHT - laser.y - laser.height / 2,
                24
            );
            const pulse = 1 + Math.sin(this.elapsed * 24 + index) * 0.18;
            mesh.scale.set(pulse, 1, pulse);
        });
    }

    private syncEnemies(state: ThreeRenderState): void {
        this.enemyVisuals.forEach((visual, index) => {
            const enemy = state.enemies[index];
            visual.group.visible = Boolean(enemy);
            if (!enemy) return;

            if (visual.shape !== enemy.type.shape || visual.size !== enemy.type.size) {
                const geometry = this.enemyGeometry(enemy.type.shape, enemy.type.size);
                visual.body.geometry = geometry;
                visual.outline.geometry.dispose();
                visual.outline.geometry = new THREE.EdgesGeometry(geometry, 28);
                visual.shape = enemy.type.shape;
                visual.size = enemy.type.size;
            }

            const material = visual.body.material as THREE.MeshPhysicalMaterial;
            material.color.set(enemy.type.color);
            material.emissive.set(enemy.type.color).multiplyScalar(0.45);
            const outlineMaterial = visual.outline.material as THREE.LineBasicMaterial;
            outlineMaterial.color.set(enemy.type.color).lerp(new THREE.Color(0xffffff), 0.55);
            const haloMaterial = visual.halo.material as THREE.MeshBasicMaterial;
            haloMaterial.color.set(enemy.type.color);
            const coreMaterial = visual.core.material as THREE.MeshBasicMaterial;
            coreMaterial.color.set(enemy.type.color).lerp(new THREE.Color(0xffffff), 0.62);
            const ringMaterial = visual.ring.material as THREE.MeshBasicMaterial;
            ringMaterial.color.set(enemy.type.color).lerp(new THREE.Color(0xffffff), 0.32);
            visual.satellites.forEach((satellite) => {
                const satelliteMaterial = satellite.material as THREE.MeshBasicMaterial;
                satelliteMaterial.color.set(enemy.type.color).lerp(new THREE.Color(0xffffff), 0.48);
            });

            const destructionProgress = enemy.isDestroying
                ? Math.min(1, enemy.destroyTime / 0.5)
                : 0;
            const impactDuration = enemy.impactKind === 'paddle' ? 0.32 : 0.18;
            const impactStrength = Math.min(1, Math.max(0, (enemy.impactTime ?? 0) / impactDuration));
            const impactPulse = Math.sin(impactStrength * Math.PI);
            const collapse = 1 - Math.pow(destructionProgress, 1.5);
            const burst = Math.sin(destructionProgress * Math.PI);
            const impactScale = 1 + impactPulse * (enemy.impactKind === 'paddle' ? 0.28 : 0.16);
            visual.group.position.set(enemy.x, LOGICAL_HEIGHT - enemy.y, 24);
            visual.group.rotation.set(
                destructionProgress * 0.9,
                destructionProgress * 1.4,
                -enemy.angle + destructionProgress * Math.PI * 3
            );
            visual.group.scale.set(
                collapse * (1 + burst * 0.25) * impactScale,
                collapse * (1 - burst * 0.18) * (1 - impactPulse * 0.08),
                collapse * impactScale
            );
            material.emissiveIntensity = 0.75 + impactPulse * 2.2;
            material.opacity = 1 - destructionProgress;
            outlineMaterial.opacity = 0.8 * (1 - destructionProgress);
            visual.halo.scale.setScalar(
                enemy.isDestroying
                    ? 1 + destructionProgress * 3.8
                    : 1 + Math.sin(this.elapsed * 5 + index) * 0.08
            );
            haloMaterial.opacity = enemy.isDestroying
                ? (1 - destructionProgress) * 0.42
                : 0.12 + Math.sin(this.elapsed * 4 + index) * 0.04;
            visual.core.scale.setScalar(
                enemy.isDestroying
                    ? 0.9 + burst * 2.8
                    : 0.9 + Math.sin(this.elapsed * 7 + index) * 0.12 + impactPulse * 0.75
            );
            coreMaterial.opacity = enemy.isDestroying ? 1 - destructionProgress : 0.9;
            visual.ring.rotation.z = this.elapsed * (index % 2 === 0 ? 1.8 : -1.8) + destructionProgress * 8;
            visual.ring.scale.set(
                1 + Math.sin(this.elapsed * 3 + index) * 0.08,
                0.82 + Math.cos(this.elapsed * 3 + index) * 0.05,
                1
            );
            visual.satellites.forEach((satellite, satelliteIndex) => {
                const orbitAngle = this.elapsed * (1.4 + index * 0.12) + satelliteIndex * Math.PI * 2 / 3;
                const orbitRadius = enemy.type.size * (0.76 + destructionProgress * 3.2);
                satellite.position.x = Math.cos(orbitAngle) * orbitRadius;
                satellite.position.y = Math.sin(orbitAngle) * orbitRadius;
                satellite.rotation.z = orbitAngle;
                satellite.scale.setScalar(1 - destructionProgress * 0.75);
            });
        });
    }

    private syncBarrier(state: ThreeRenderState): void {
        const width = state.gameBorder.right - state.gameBorder.left;
        this.barrier.visible = state.activePowerUps.invincible;
        this.barrier.position.set(
            state.gameBorder.left + width / 2,
            LOGICAL_HEIGHT - state.gameBorder.bottom + 7,
            12
        );
        this.barrier.scale.x = width / 100;
        const material = this.barrier.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6 + Math.sin(this.elapsed * 8) * 0.2;
    }

    private enemyGeometry(shape: RenderEnemy['type']['shape'], size: number): THREE.BufferGeometry {
        const key = `${shape}:${size}`;
        const cached = this.enemyGeometries.get(key);
        if (cached) return cached;

        let geometry: THREE.BufferGeometry;
        switch (shape) {
            case 'triangle':
                geometry = this.createEnemyShape([
                    new THREE.Vector2(0, size),
                    new THREE.Vector2(-size * 0.92, -size * 0.78),
                    new THREE.Vector2(size * 0.92, -size * 0.78)
                ], size * 0.42);
                break;
            case 'square':
                geometry = createBeveledBox(size * 1.55, size * 1.55, size * 0.5, size * 0.12);
                break;
            case 'hexagon':
                geometry = this.createEnemyShape(
                    Array.from({ length: 6 }, (_, index) => {
                        const angle = Math.PI / 6 + index * Math.PI / 3;
                        return new THREE.Vector2(Math.cos(angle) * size, Math.sin(angle) * size);
                    }),
                    size * 0.42
                );
                break;
            default:
                geometry = new THREE.CylinderGeometry(size, size, size * 0.45, 16);
                geometry.rotateX(Math.PI / 2);
        }
        this.enemyGeometries.set(key, geometry);
        return geometry;
    }

    private createEnemyShape(points: THREE.Vector2[], depth: number): THREE.ExtrudeGeometry {
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: true,
            bevelSegments: 1,
            bevelSize: Math.max(1.5, depth * 0.14),
            bevelThickness: Math.max(1.5, depth * 0.14),
            curveSegments: 1
        });
        geometry.translate(0, 0, -depth / 2);
        geometry.computeVertexNormals();
        return geometry;
    }

    private getPowerUpTexture(label: string): THREE.CanvasTexture {
        const cached = this.powerUpTextures.get(label);
        if (cached) return cached;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.beginPath();
            context.moveTo(92, 12);
            context.lineTo(164, 12);
            context.arcTo(208, 12, 208, 56, 44);
            context.arcTo(208, 116, 164, 116, 44);
            context.lineTo(92, 116);
            context.arcTo(48, 116, 48, 72, 44);
            context.arcTo(48, 12, 92, 12, 44);
            context.closePath();
            context.fillStyle = 'rgba(2, 10, 22, 0.86)';
            context.fill();
            context.lineWidth = 7;
            context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            context.stroke();

            context.font = '900 82px Arial Black, Arial, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = '#ffffff';
            context.strokeStyle = '#00111f';
            context.lineWidth = 12;
            context.lineJoin = 'round';
            context.strokeText(label, canvas.width / 2, canvas.height / 2 + 2);
            context.fillText(label, canvas.width / 2, canvas.height / 2 + 2);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        this.powerUpTextures.set(label, texture);
        return texture;
    }
}

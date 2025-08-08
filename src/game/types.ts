export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  baseSpeed: number;
  onPad: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export interface Brick {
  x: number;
  y: number;
  status: number; // 0 destroyed, 1 active
  hits: number;   // remaining hits for gray blocks
  indestructible: boolean;
  color: string;  // level char e.g. 'W','Y','2','#'
}

export interface PowerUp {
  x: number;
  y: number;
  type: string; // E+, E-, S+, S-, V, B, +, F, D, L
  color: string;
  width: number;
  height: number;
  dy: number;
}

export interface EnemyType {
  shape: 'circle' | 'triangle' | 'square' | 'hexagon';
  color: string;
  size: number;
  pattern: 'zigzag' | 'wave' | 'straight' | 'circular';
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  angle: number;
  rotationSpeed: number;
  pattern: EnemyType['pattern'];
  speed: number;
  patternTime: number;
  isDestroying: boolean;
  destroyTime: number;
  originalSize: number;
  targetBall: Ball | null;
  targetTime: number;
}

export interface LaserShot {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}


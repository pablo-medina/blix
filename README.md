# Blix Game

A modern breakout game built with vanilla JavaScript and HTML5 Canvas.

## Requirements

- Node.js (version 14 or higher)
- Yarn (install with `npm install -g yarn`)

## Installation

1. Clone or download this repository
2. Open a terminal in the project folder
3. Run `yarn install` to install dependencies

## Available Scripts

### Development
- `yarn start`: Launches the game in development mode using Electron
- `yarn start:web`: Builds and opens the web version in your default browser

### Build Scripts
- `yarn build`: Builds the game for all platforms (Windows, macOS, Linux)
- `yarn build:win`: Builds the game for Windows
- `yarn build:mac`: Builds the game for macOS
- `yarn build:linux`: Builds the game for Linux
- `yarn build:web`: Builds the web version of the game

## How to Play

1. Run `yarn start` to launch the game
2. Use the left and right arrow keys or a joystick to move the paddle
3. Break all blocks to win
4. You have 3 lives to complete the game

## Controls

### Basic Controls
- **Left/Right Arrows**: Move paddle left/right
- **Up Arrow / Space**: Launch the ball
- **P key**: Pause/Resume game
- **Esc key**: Return to main menu
- **Joystick**: Move paddle using X-axis

### Debug Controls
- **+ key**: Advance to next level (or end game if on last level)
- **- key**: Go to previous level (or return to menu if on first level)
- *** key**: Restart current level
- **R key**: Toggle FPS counter visibility

## Power-ups

Power-ups appear when breaking blocks and fall down. Catch them with your paddle to activate their effects.

| Symbol | Name | Effect | Duration | Color |
|--------|------|---------|-----------|--------|
| E+ | Enlarge | Increases paddle size | 10s | Blue |
| E- | Shrink | Decreases paddle size | 10s | Blue |
| S+ | Speed Up | Increases ball speed | 10s | Orange |
| S- | Slow Down | Decreases ball speed | 10s | Orange |
| V | Extra Life | Adds one life | Instant | Yellow |
| B | Barrier | Allows ball to bounce on bottom | 15s | Turquoise |
| + | Extra Ball | Adds an additional ball | Instant | Green |
| F | Fire Ball | Ball can destroy blocks without bouncing | 10s | Red |
| D | Double Size | Doubles ball size | 15s | Purple |
| L | Laser | Enables laser shots (Space to shoot) | 5s | Pink |

### Power-up Stacking
- Size (E+/E-) and Speed (S+/S-) power-ups can stack up to 5 times
- Multiple power-ups of the same type will refresh their duration
- Some power-ups have visual indicators showing their remaining duration

## Block Types

| Type | Hits Required | Description |
|------|---------------|-------------|
| Basic Blocks | 1 | Standard blocks that break in one hit. Come in various colors. |
| Reinforced Blocks | 2 | Gray blocks that require two hits to break. |
| Indestructible Blocks | ∞ | Cyan blocks that cannot be destroyed. They can only be passed through with special power-ups. |

## Features

- Multiple levels with different block patterns
- Power-ups that change paddle size and ball speed
- Background music and sound effects
- Responsive design that adapts to window size
- Particle effects and visual feedback

## Asset Credits

- pingpongbat.ogg: https://opengameart.org/content/ping-pong-sounds
- hit01.wav: https://opengameart.org/content/hit-sound-bitcrush
- Neon Bricks Dance Music: Made with SUNO AI (http://suno.com)
- Metal Click: https://opengameart.org/content/metal-click

Enjoy playing!
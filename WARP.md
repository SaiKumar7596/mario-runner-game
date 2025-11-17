# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a small, static JavaScript game: a Mario-style 2D runner rendered on an HTML5 canvas. There is no backend or framework; the game runs entirely in the browser from static files.

## Commands and Environment

All commands assume the working directory is the project root (`mario-runner-game`).

### Prerequisites

- Node.js **18+** (required for `fs.promises.cp` used in the build script).

### Install dependencies

There are currently no dependencies declared beyond the default `package.json`, but to keep `node_modules` in sync, you can still run:

```sh
npm install
```

### Build

Builds a production-ready `dist` directory by copying the `src` folder after cleaning any existing build:

```sh
npm run build
```

- Source: `scripts/build.mjs`
- Effect: removes `dist/` (if it exists), recreates it, and recursively copies `src/` → `dist/`.

### Tests and linting

There are **no test or lint scripts configured** in `package.json` yet (`scripts` only defines `build`).

- Running tests or linting, including a single-test invocation, is not currently supported via npm scripts.
- If you add testing or linting tooling (e.g., Jest, Vitest, ESLint), update this section with the relevant commands.

### Running the game locally

The game is a static site and can be opened directly from the filesystem or via any static file server:

- During development, you can open `src/index.html` in a browser (or use a local static server of your choice) to see live changes.
- After `npm run build`, open `dist/index.html` to verify the built output.

There is no dedicated `npm run dev`/serve script; agents should not assume one exists.

## High-Level Architecture and Structure

### Top-level layout

- `src/index.html` is the single HTML entry point.
  - Includes the `<canvas id="game-canvas">` element and basic UI: title, score display, restart button, and control instructions.
  - Loads the game logic as an ES module via `<script type="module" src="./game.js"></script>` and the stylesheet via `./style.css`.
- `src/style.css` provides layout and theming (background gradients, canvas framing, responsive sizing, and button styles).
- `src/game.js` contains **all game logic** (state management, main loop, rendering, and input handling) in a single module.
- `scripts/build.mjs` is a Node-only script that implements the build pipeline (clean + copy).

There are no additional modules, asset pipelines, or frameworks; everything relevant to gameplay is in `src/game.js`.

### Build pipeline (`scripts/build.mjs`)

- Determines the project root based on the script location, then resolves:
  - `srcDir` → `src/`
  - `distDir` → `dist/`
- Build steps:
  1. `rm(distDir, { recursive: true, force: true })` — clean any existing `dist` directory.
  2. `mkdir(distDir, { recursive: true })` — ensure `dist` exists.
  3. `cp(srcDir, distDir, { recursive: true })` — recursively copy all files from `src` to `dist`.
- On success, logs `"Build complete: src → dist"`; on failure, logs a message and exits with code `1`.

Agents modifying the build should preserve the simple “clean and copy” behavior unless there is a clear requirement for a more complex bundling step.

### Game loop and state (`src/game.js`)

The game script uses module-scope variables to hold global state and defines several pure or side-effectful helper functions.

#### Core state

- **Canvas and context**: acquired once at module load from `#game-canvas` and stored as `canvas`/`ctx`.
- **DOM references**: `scoreEl` (score text span) and `restartBtn` (button) are cached for updates and event binding.
- **Constants**:
  - `GROUND_Y`, `GRAVITY`, `JUMP_FORCE` define physics.
  - `OBSTACLE_MIN_GAP`, `OBSTACLE_MAX_GAP`, `INITIAL_SPEED` define obstacle spacing and initial difficulty.
- **Player**: a single `player` object with position, size, vertical velocity, and `onGround` flag.
- **Obstacles**: `obstacles` is an array of simple AABB rectangles with `x`, `y`, `width`, `height`.
- **Game state**: `speed`, `score`, `lastTime`, `gameOver`, `spawnTimer` tracked at module scope.

#### Main functions

- `resetGame()` — reinitializes player position/velocity, clears obstacles, resets speed, score, timers, and `gameOver`.
- `spawnObstacle()` — creates an obstacle of randomized size positioned off-screen to the right, aligned to the ground.
- `update(delta)` — advances the simulation:
  - Increases `speed` gradually over time for difficulty scaling.
  - Applies gravity and enforces ground collision.
  - Manages obstacle spawning based on `spawnTimer` using randomized spacing.
  - Moves obstacles left by `speed` and removes off-screen ones.
  - Performs AABB collision detection between the player and each obstacle, setting `gameOver` on collision.
  - Updates and displays `score` based on elapsed time.
- Rendering functions:
  - `drawBackground()` — draws ground and simple animated clouds using the current time.
  - `drawPlayer()` — draws a simple blocky character plus a hat.
  - `drawObstacles()` — renders each obstacle rectangle.
  - `drawGameOver()` — overlays a translucent screen and the “Game Over” text when `gameOver` is true.
- `render()` — clears the canvas and calls the individual draw functions in order (background → obstacles → player → game-over overlay).
- `loop(timestamp)` — main animation loop driven by `requestAnimationFrame`:
  - Computes `delta` from `lastTime`, updates `lastTime`.
  - Calls `update(delta)` then `render()`.
  - Schedules the next frame.
- `handleJump()` — triggers a jump by applying `JUMP_FORCE` to `player.vy` if the player is on the ground and the game is not over.

#### Input wiring

- `keydown` listener on `window`:
  - For `Space` or `ArrowUp`, prevents default browser behavior and calls `handleJump()`.
- `click` listener on `restartBtn`:
  - Calls `resetGame()` to restart after a game over.

At module load, `resetGame()` is called once, then `requestAnimationFrame(loop)` starts the game.

### Styling and layout (`src/style.css`)

- Uses full-page flexbox centering to place `#game-container` in the viewport.
- Styles the canvas with a border, rounded corners, and a background gradient that visually separates sky and ground.
- Defines responsive behavior for narrower viewports by scaling the canvas to the container width.
- Styles the score display and restart button to visually match the arcade-style theme.

## Notes for Future Agents

- There are no separate modules or build-time transforms; modifying gameplay currently means editing `src/game.js` directly.
- Any refactor that introduces additional modules or more complex build tooling (bundlers, asset processing, etc.) should update this file to reflect the new architecture and commands.

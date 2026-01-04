# Bomberman Escape

**Bomberman Escape** is a fast-paced, grid-based survival game built with **React 19** and **Tailwind CSS**.
Players must navigate a procedurally generated maze, destroy obstacles, defeat monsters, and collect power-ups to safely reach the exit.

---

## Features

* **Procedural Maze Generation**
  Each game generates a randomized **12 × 12** grid filled with destructible blocks, traps, and power-ups.

* **Dynamic Power-Ups**
  Boost your chances of survival with:

  * Health upgrades
  * Increased bomb capacity
  * Expanded bomb explosion range

* **AI Monsters**
  Purple monsters roam the grid and attempt to collide with the player.

* **Score System**
  Earn points by destroying blocks, defeating enemies, and collecting upgrades.

---

## Gameplay

### Objective

Reach the **Exit (🚪)** tile located at the **bottom-right** corner of the map.

You lose the game if your health drops to zero due to:

* Monster collisions
* Traps
* Being caught in your own bomb’s explosion

---

### Controls

The game uses a global `keydown` event listener:

* **Arrow Keys** → Move the player (🧑)
* **Spacebar** → Place a bomb (💣)

---

### Scoring Table

Your score updates in real time based on the following actions:

| Action                          | Points |
| ------------------------------- | ------ |
| Destroying a destructible block | +10    |
| Defeating a monster             | +100   |
| Collecting a health upgrade     | +30    |
| Collecting bomb/range upgrades  | +50    |

---

## Technical Details

### Core Mechanics

* **Grid System**
  The game runs on a fixed **12 × 12** grid using a `CELL_TYPES` enum to represent walls, traps, exits, and other entities.

* **Bomb Logic**

  * Bombs have a **2-second fuse**
  * Explosions propagate in four directions
  * Propagation stops when hitting a wall or a destructible block

* **Monster AI**
  Monsters move to a random adjacent valid tile every **800 ms**.

---

### Tech Stack

* **Framework:** React 19
* **Styling:** Tailwind CSS 3 (utility-first, responsive design)
* **Icons:** Lucide-React
* **Build Tool:** Create React App (CRA)

---

## Project Structure

The project follows a standard React directory layout:

```
src/
 ├── App.js        # Core game logic, state management, and rendering
 ├── index.js      # Application entry point
tailwind.config.js # Tailwind CSS configuration
package.json       # Dependencies and scripts
```

---

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

---

### Production Build

To create an optimized production build:

```bash
npm run build
```

---

Enjoy surviving the maze and escaping the explosion! 💥🧑‍🚀

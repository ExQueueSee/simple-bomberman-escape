import React, { useState, useEffect, useCallback } from 'react';
import { Bomb, Flame, Heart, Zap, Trophy } from 'lucide-react';

const GRID_SIZE = 12;
const CELL_SIZE = 45;

const CELL_TYPES = {
  EMPTY: 0,
  WALL: 1,
  DESTRUCTIBLE: 2,
  PLAYER: 3,
  EXIT: 4,
  TRAP: 5,
  MONSTER: 6,
  BOMB: 7,
  EXPLOSION: 8,
  UPGRADE_BOMBS: 9,
  UPGRADE_RANGE: 10,
  UPGRADE_HEALTH: 11
};

const BombermanGame = () => {
  const [grid, setGrid] = useState([]);
  const [player, setPlayer] = useState({ x: 1, y: 1, health: 3, bombs: 2, range: 2, maxBombs: 2 });
  const [monsters, setMonsters] = useState([]);
  const [activeBombs, setActiveBombs] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState(0);

  const initializeGrid = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_TYPES.EMPTY));
    
    // Walls border
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[0][i] = CELL_TYPES.WALL;
      newGrid[GRID_SIZE - 1][i] = CELL_TYPES.WALL;
      newGrid[i][0] = CELL_TYPES.WALL;
      newGrid[i][GRID_SIZE - 1] = CELL_TYPES.WALL;
    }

    // Internal walls pattern
    for (let y = 2; y < GRID_SIZE - 2; y += 2) {
      for (let x = 2; x < GRID_SIZE - 2; x += 2) {
        newGrid[y][x] = CELL_TYPES.WALL;
      }
    }

    // Destructible blocks and upgrades
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (newGrid[y][x] === CELL_TYPES.EMPTY) {
          if ((x < 3 && y < 3) || (x > GRID_SIZE - 4 && y > GRID_SIZE - 4)) continue;
          
          const rand = Math.random();
          if (rand < 0.4) {
            newGrid[y][x] = CELL_TYPES.DESTRUCTIBLE;
          } else if (rand < 0.43) {
            newGrid[y][x] = CELL_TYPES.TRAP;
          } else if (rand < 0.45) {
            newGrid[y][x] = CELL_TYPES.UPGRADE_BOMBS;
          } else if (rand < 0.47) {
            newGrid[y][x] = CELL_TYPES.UPGRADE_RANGE;
          } else if (rand < 0.49) {
            newGrid[y][x] = CELL_TYPES.UPGRADE_HEALTH;
          }
        }
      }
    }

    // Exit
    newGrid[GRID_SIZE - 2][GRID_SIZE - 2] = CELL_TYPES.EXIT;

    // Monsters
    const newMonsters = [];
    for (let i = 0; i < 4; i++) {
      let mx, my;
      do {
        mx = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        my = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
      } while (newGrid[my][mx] !== CELL_TYPES.EMPTY || (mx < 4 && my < 4));
      newMonsters.push({ x: mx, y: my, id: i });
    }

    setGrid(newGrid);
    setMonsters(newMonsters);
    setPlayer({ x: 1, y: 1, health: 3, bombs: 2, range: 2, maxBombs: 2 });
    setActiveBombs([]);
    setExplosions([]);
    setGameStatus('playing');
    setScore(0);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const moveMonsters = useCallback(() => {
    if (gameStatus !== 'playing') return;

    setMonsters(prev => prev.map(monster => {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      const validMoves = directions.filter(dir => {
        const nx = monster.x + dir.dx;
        const ny = monster.y + dir.dy;
        return grid[ny]?.[nx] === CELL_TYPES.EMPTY || grid[ny]?.[nx] === CELL_TYPES.TRAP;
      });

      if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        return { ...monster, x: monster.x + move.dx, y: monster.y + move.dy };
      }
      return monster;
    }));
  }, [grid, gameStatus]);

  useEffect(() => {
    const interval = setInterval(moveMonsters, 800);
    return () => clearInterval(interval);
  }, [moveMonsters]);

  const checkCollision = useCallback((x, y) => {
    if (monsters.some(m => m.x === x && m.y === y)) {
      setPlayer(prev => {
        const newHealth = prev.health - 1;
        if (newHealth <= 0) {
          setGameStatus('lost');
        }
        return { ...prev, health: newHealth };
      });
    }

    if (explosions.some(e => e.x === x && e.y === y)) {
      setPlayer(prev => {
        const newHealth = prev.health - 1;
        if (newHealth <= 0) {
          setGameStatus('lost');
        }
        return { ...prev, health: newHealth };
      });
    }
  }, [monsters, explosions]);

  const handleMove = useCallback((dx, dy) => {
    if (gameStatus !== 'playing') return;

    setPlayer(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      const cellType = grid[newY]?.[newX];
      // FIX: don't treat EMPTY(0) as blocked; only block if out-of-bounds (null/undefined)
      if (cellType == null || cellType === CELL_TYPES.WALL || cellType === CELL_TYPES.DESTRUCTIBLE || 
          cellType === CELL_TYPES.BOMB) {
        return prev;
      }

      let updates = { x: newX, y: newY };

      if (cellType === CELL_TYPES.EXIT) {
        setGameStatus('won');
      } else if (cellType === CELL_TYPES.TRAP) {
        updates.health = prev.health - 1;
        if (updates.health <= 0) setGameStatus('lost');
        setGrid(g => {
          const newGrid = g.map(row => [...row]);
          newGrid[newY][newX] = CELL_TYPES.EMPTY;
          return newGrid;
        });
      } else if (cellType === CELL_TYPES.UPGRADE_BOMBS) {
        updates.maxBombs = prev.maxBombs + 1;
        updates.bombs = prev.bombs + 1;
        setScore(s => s + 50);
        setGrid(g => {
          const newGrid = g.map(row => [...row]);
          newGrid[newY][newX] = CELL_TYPES.EMPTY;
          return newGrid;
        });
      } else if (cellType === CELL_TYPES.UPGRADE_RANGE) {
        updates.range = prev.range + 1;
        setScore(s => s + 50);
        setGrid(g => {
          const newGrid = g.map(row => [...row]);
          newGrid[newY][newX] = CELL_TYPES.EMPTY;
          return newGrid;
        });
      } else if (cellType === CELL_TYPES.UPGRADE_HEALTH) {
        updates.health = Math.min(prev.health + 1, 5);
        setScore(s => s + 30);
        setGrid(g => {
          const newGrid = g.map(row => [...row]);
          newGrid[newY][newX] = CELL_TYPES.EMPTY;
          return newGrid;
        });
      }

      setTimeout(() => checkCollision(newX, newY), 0);
      return { ...prev, ...updates };
    });
  }, [grid, gameStatus, checkCollision]);

  const placeBomb = useCallback(() => {
    if (gameStatus !== 'playing' || player.bombs <= 0) return;

    setPlayer(prev => ({ ...prev, bombs: prev.bombs - 1 }));
    
    const bomb = { x: player.x, y: player.y, id: Date.now() };
    setActiveBombs(prev => [...prev, bomb]);

    setTimeout(() => {
      setActiveBombs(prev => prev.filter(b => b.id !== bomb.id));
      
      const explosionCells = [{ x: bomb.x, y: bomb.y }];
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

       directions.forEach(dir => {
        for (let i = 1; i <= player.range; i++) {
          const x = bomb.x + dir.dx * i;
          const y = bomb.y + dir.dy * i;
          const cell = grid[y]?.[x];

          // FIX: don't treat EMPTY(0) as out-of-bounds
          if (cell == null || cell === CELL_TYPES.WALL) break;

          explosionCells.push({ x, y });

          if (cell === CELL_TYPES.DESTRUCTIBLE) break;
        }
      });

      setExplosions(explosionCells);

      setGrid(g => {
        const newGrid = g.map(row => [...row]);
        explosionCells.forEach(({ x, y }) => {
          if (newGrid[y][x] === CELL_TYPES.DESTRUCTIBLE) {
            newGrid[y][x] = CELL_TYPES.EMPTY;
            setScore(s => s + 10);
          }
        });
        return newGrid;
      });

      setMonsters(prev => prev.filter(m => {
        const hit = explosionCells.some(e => e.x === m.x && e.y === m.y);
        if (hit) setScore(s => s + 100);
        return !hit;
      }));

      if (explosionCells.some(e => e.x === player.x && e.y === player.y)) {
        setPlayer(prev => {
          const newHealth = prev.health - 1;
          if (newHealth <= 0) setGameStatus('lost');
          return { ...prev, health: newHealth };
        });
      }

      setTimeout(() => {
        setExplosions([]);
        setPlayer(prev => ({ ...prev, bombs: Math.min(prev.bombs + 1, prev.maxBombs) }));
      }, 500);
    }, 2000);
  }, [player, grid, gameStatus]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

      if (keysToBlock.includes(e.key)) {
        e.preventDefault(); // stops page scroll
      }

      if (e.key === 'ArrowUp') handleMove(0, -1);
      else if (e.key === 'ArrowDown') handleMove(0, 1);
      else if (e.key === 'ArrowLeft') handleMove(-1, 0);
      else if (e.key === 'ArrowRight') handleMove(1, 0);
      else if (e.key === ' ') placeBomb();
    };

    window.addEventListener('keydown', handleKeyPress, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyPress, { passive: false });
  }, [handleMove, placeBomb]);

  const getCellColor = (cellType, x, y) => {
    if (player.x === x && player.y === y) return 'bg-blue-500';
    if (monsters.some(m => m.x === x && m.y === y)) return 'bg-purple-600';
    if (activeBombs.some(b => b.x === x && b.y === y)) return 'bg-gray-800';
    if (explosions.some(e => e.x === x && e.y === y)) return 'bg-orange-500';
    
    switch (cellType) {
      case CELL_TYPES.WALL: return 'bg-gray-700';
      case CELL_TYPES.DESTRUCTIBLE: return 'bg-amber-700';
      case CELL_TYPES.EXIT: return 'bg-green-500';
      case CELL_TYPES.TRAP: return 'bg-red-700';
      case CELL_TYPES.UPGRADE_BOMBS: return 'bg-cyan-500';
      case CELL_TYPES.UPGRADE_RANGE: return 'bg-yellow-500';
      case CELL_TYPES.UPGRADE_HEALTH: return 'bg-pink-500';
      default: return 'bg-gray-900';
    }
  };

  const getCellIcon = (cellType, x, y) => {
    if (player.x === x && player.y === y) return '🧑';
    if (monsters.some(m => m.x === x && m.y === y)) return '👾';
    if (activeBombs.some(b => b.x === x && b.y === y)) return '💣';
    if (explosions.some(e => e.x === x && e.y === y)) return '💥';
    
    switch (cellType) {
      case CELL_TYPES.EXIT: return '🚪';
      case CELL_TYPES.TRAP: return '⚠️';
      case CELL_TYPES.UPGRADE_BOMBS: return '💣';
      case CELL_TYPES.UPGRADE_RANGE: return '⚡';
      case CELL_TYPES.UPGRADE_HEALTH: return '❤️';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4">
      <div className="mb-4 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">Bomberman Escape</h1>
        <div className="flex gap-6 justify-center text-lg">
          <div className="flex items-center gap-2">
            <Heart className="text-red-500" size={20} />
            <span>{player.health}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bomb className="text-gray-300" size={20} />
            <span>{player.bombs}/{player.maxBombs}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={20} />
            <span>{player.range}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <span>{score}</span>
          </div>
        </div>
      </div>

      <div 
        className="border-4 border-gray-700 relative"
        style={{ 
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE 
        }}
      >
        {grid.map((row, y) => (
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute border border-gray-800 flex items-center justify-center text-2xl ${getCellColor(cell, x, y)}`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE
              }}
            >
              {getCellIcon(cell, x, y)}
            </div>
          ))
        ))}
      </div>

      <div className="mt-4 text-white text-center">
        <p className="mb-2">Arrow keys to move, Space to place bomb</p>
        <p className="text-sm text-gray-400">
          💣 +Bombs | ⚡ +Range | ❤️ +Health | ⚠️ Trap | 👾 Monster
        </p>
      </div>

      {gameStatus === 'won' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-green-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4">Victory!</h2>
            <p className="text-2xl mb-4">Score: {score}</p>
            <button
              onClick={initializeGrid}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-red-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4">Game Over</h2>
            <p className="text-2xl mb-4">Score: {score}</p>
            <button
              onClick={initializeGrid}
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BombermanGame;
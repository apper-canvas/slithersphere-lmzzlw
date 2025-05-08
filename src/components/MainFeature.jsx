import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import getIcon from '../utils/iconUtils';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 60;
const FOOD_POINTS = 10;
const SPECIAL_FOOD_POINTS = 30;
const SPECIAL_FOOD_CHANCE = 0.2;

// Direction constants
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};
// Initial level
const DEFAULT_LEVEL = 1;


const MainFeature = ({ onScoreSubmit }) => {
  // Icon components
  const PlayIcon = getIcon("Play");
  const PauseIcon = getIcon("Pause");
  const RefreshCwIcon = getIcon("RefreshCw");
  const ChevronUpIcon = getIcon("ChevronUp");
  const ChevronDownIcon = getIcon("ChevronDown");
  const ChevronLeftIcon = getIcon("ChevronLeft");
  const ChevronRightIcon = getIcon("ChevronRight");
  const MenuIcon = getIcon("Menu");
  const SaveIcon = getIcon("Save");
  const TrophyIcon = getIcon("Trophy");
  const ZapIcon = getIcon("Zap");
  
  // Game state
  const [obstacles, setObstacles] = useState([]);
  const [movingObstacles, setMovingObstacles] = useState([]);
  const [teleportZones, setTeleportZones] = useState([]);
  const [snake, setSnake] = useState([]);
  const [food, setFood] = useState(null);
  const [specialFood, setSpecialFood] = useState(null);
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [nextDirection, setNextDirection] = useState(DIRECTIONS.RIGHT);
  const [isRunning, setIsRunning] = useState(false);
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('gameLevel') || DEFAULT_LEVEL));
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [difficulty, setDifficulty] = useState('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || '');
  const [showKeyControls, setShowKeyControls] = useState(true);
  
  const gameLoopRef = useRef(null);
  const canvasRef = useRef(null);
  const lastRenderTimeRef = useRef(0);
  const gameStartTimeRef = useRef(Date.now());
  const shrinkMazeRef = useRef(false);
  const movingObstacleDirectionRef = useRef(1);

  // Initialize game
  const initGame = useCallback(() => {
    // Reset state
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]);
    setDirection(DIRECTIONS.RIGHT);
    setNextDirection(DIRECTIONS.RIGHT);
    setGameOver(false);
    setScore(0);
    placeFood();
    setSpecialFood(null);
    setupLevel(level);

    // Set speed based on difficulty
    let initialSpeed = INITIAL_SPEED;
    if (difficulty === 'easy') initialSpeed = INITIAL_SPEED + 50;
    if (difficulty === 'hard') initialSpeed = INITIAL_SPEED - 30;
   
    // Adjust for level difficulty
    if (level > 1) {
      initialSpeed = Math.max(MIN_SPEED, initialSpeed - (level * 10));
    }
    
    setSpeed(initialSpeed);
  }, [difficulty, level]);

  // Setup level-specific obstacles and features
  const setupLevel = useCallback((levelNum) => {
    // Clear previous level data
    setObstacles([]);
    setMovingObstacles([]);
    setTeleportZones([]);
    
    // Apply level-specific setup
    switch(levelNum) {
      case 2: // Level 2: Obstacle Course
        setupObstacleCourse();
        break;
      case 3: // Level 3: Speed Demon
        setupSpeedDemon();
        break;
      case 4: // Level 4: Maze Runner
        setupMazeRunner();
        break;
      default: // Level 1: Classic
        // No obstacles or special features
        break;
    }
  }, []);

  // Level 2: Basic obstacles
  const setupObstacleCourse = () => {
    const walls = [];
    
    // Horizontal walls
    for (let x = 5; x < 15; x++) {
      walls.push({ x, y: 5 });
      walls.push({ x, y: 15 });
    }
    
    // Vertical walls
    for (let y = 6; y < 15; y++) {
      if (y !== 10) { // Gap in the middle
        walls.push({ x: 5, y });
        walls.push({ x: 14, y });
      }
    }
    
    setObstacles(walls);
  };

  // Level 3: Moving obstacles and faster gameplay
  const setupSpeedDemon = () => {
    // Static obstacles
    const walls = [];
    
    // Corner obstacles
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        walls.push({ x: i, y: j });
        walls.push({ x: GRID_SIZE - 1 - i, y: j });
        walls.push({ x: i, y: GRID_SIZE - 1 - j });
        walls.push({ x: GRID_SIZE - 1 - i, y: GRID_SIZE - 1 - j });
      }
    }
    
    // Moving obstacles
    const movingBlocks = [];
    
    // Horizontal moving obstacles
    for (let y = 5; y < GRID_SIZE - 5; y += 5) {
      movingBlocks.push({ x: 5, y, direction: 'horizontal' });
    }
    
    // Vertical moving obstacles
    for (let x = 5; x < GRID_SIZE - 5; x += 5) {
      movingBlocks.push({ x, y: 5, direction: 'vertical' });
    }
    
    setObstacles(walls);
    setMovingObstacles(movingBlocks);
    movingObstacleDirectionRef.current = 1;
  };

  // Level 4: Complex maze with teleport zones
  const setupMazeRunner = () => {
    const walls = [];
    
    // Create maze pattern
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // Border walls
        if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
          walls.push({ x, y });
          continue;
        }
        
        // Maze pattern - inner walls
        if ((x % 5 === 0 && y % 3 !== 0) || (y % 4 === 0 && x % 3 !== 0 && y !== GRID_SIZE/2)) {
          walls.push({ x, y });
        }
      }
    }
    
    // Add teleport zones
    const teleports = [
      { x: 3, y: 3, target: { x: GRID_SIZE - 4, y: GRID_SIZE - 4 } },
      { x: GRID_SIZE - 4, y: 3, target: { x: 3, y: GRID_SIZE - 4 } },
    ];
    
    setObstacles(walls);
    setTeleportZones(teleports);
  };
  
  // Generate random position
  const randomGridPosition = () => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  };
  
  // Check if position is on snake
  const isPositionOnSnake = (pos) => {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
  };
  
  // Check if position has an obstacle
  const isPositionObstacle = (pos) => {
    return obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y);
  };
  
  // Place food in random location
  const placeFood = () => {
    let newFoodPosition;
    do {
      newFoodPosition = randomGridPosition();
    } while (isPositionOnSnake(newFoodPosition) || isPositionObstacle(newFoodPosition));
    
    setFood(newFoodPosition);
    
    // Chance to spawn special food
    if (Math.random() < SPECIAL_FOOD_CHANCE && !specialFood) {
      let specialFoodPosition;
      do {
        specialFoodPosition = randomGridPosition();
      } while (
        isPositionOnSnake(specialFoodPosition) ||
        isPositionObstacle(specialFoodPosition) ||
        (newFoodPosition.x === specialFoodPosition.x && newFoodPosition.y === specialFoodPosition.y)
      );
      
      setSpecialFood({
        ...specialFoodPosition,
        expiresAt: Date.now() + 5000 // Disappears after 5 seconds
      });
    }
  };
  
  // Handle key press for movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      // WASD or Arrow Keys
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== DIRECTIONS.DOWN) {
            setNextDirection(DIRECTIONS.UP);
          }
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== DIRECTIONS.UP) {
            setNextDirection(DIRECTIONS.DOWN);
          }
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== DIRECTIONS.RIGHT) {
            setNextDirection(DIRECTIONS.LEFT);
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== DIRECTIONS.RIGHT) {
            setNextDirection(DIRECTIONS.RIGHT);
          }
          e.preventDefault();
          break;
        case ' ':
          // Toggle pause
          setIsRunning(prev => !prev);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver]);
  
  // Handle touch controls
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };
  
  const handleTouchMove = (e) => {
    if (gameOver || !isRunning) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Require a minimum swipe distance
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) return;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0 && direction !== DIRECTIONS.LEFT) {
        setNextDirection(DIRECTIONS.RIGHT);
      } else if (deltaX < 0 && direction !== DIRECTIONS.RIGHT) {
        setNextDirection(DIRECTIONS.LEFT);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && direction !== DIRECTIONS.UP) {
        setNextDirection(DIRECTIONS.DOWN);
      } else if (deltaY < 0 && direction !== DIRECTIONS.DOWN) {
        setNextDirection(DIRECTIONS.UP);
      }
    }
    
    // Reset touch start
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    });
  };
  
  // Handle direction button clicks
  const handleDirectionButton = (newDirection) => {
    if (gameOver) return;
    
    // Check if the new direction is valid
    if (
      (newDirection === DIRECTIONS.UP && direction !== DIRECTIONS.DOWN) ||
      (newDirection === DIRECTIONS.DOWN && direction !== DIRECTIONS.UP) ||
      (newDirection === DIRECTIONS.LEFT && direction !== DIRECTIONS.RIGHT) ||
      (newDirection === DIRECTIONS.RIGHT && direction !== DIRECTIONS.LEFT)
    ) {
      setNextDirection(newDirection);
    }
  };
  
  // Change game level
  const changeLevel = (newLevel) => {
    setLevel(newLevel);
    localStorage.setItem('gameLevel', newLevel);
    initGame();
  };
  
  // Game loop
  useEffect(() => {
    if (!isRunning || gameOver) return;

    const gameLoop = () => {
      const now = Date.now();
      
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }

      // If enough time has passed, update game state
      if (now - lastRenderTimeRef.current > speed) {
        updateGame();
        lastRenderTimeRef.current = now;
      }

      // Check if special food needs to expire
      if (specialFood && now > specialFood.expiresAt) {
        setSpecialFood(null);
      }

      // Update moving obstacles (level 3)
      if (level === 3 && isRunning && !gameOver) {
        setMovingObstacles(prevObstacles => {
          const direction = movingObstacleDirectionRef.current;

          return prevObstacles.map(obstacle => {
            const newObstacle = { ...obstacle };

            if (obstacle.direction === 'horizontal') {
              newObstacle.x += direction;
              // Bounce back when hitting boundary
              if (newObstacle.x <= 1 || newObstacle.x >= GRID_SIZE - 2) {
                movingObstacleDirectionRef.current = -direction;
              }
            } else {
              newObstacle.y += direction;
              // Bounce back when hitting boundary
              if (newObstacle.y <= 1 || newObstacle.y >= GRID_SIZE - 2) {
                movingObstacleDirectionRef.current = -direction;
              }
            }

            return newObstacle;
          });
        });
      }

      // Shrinking maze in level 4
      if (level === 4 && isRunning && !gameOver && obstacles.length > 0) {
        // Every 15 seconds, add a new ring of walls around the edge
        const gameTime = Math.floor((now - gameStartTimeRef.current) / 1000);

        if (gameTime % 15 === 0 && gameTime > 0 && !shrinkMazeRef.current) {
          shrinkMazeRef.current = true;
          const newRing = [];
          const shrinkLevel = Math.floor(gameTime / 15);

          // Only add up to 5 shrink levels to keep game playable
          if (shrinkLevel <= 5) {
            // Add a new ring of walls
            for (let x = shrinkLevel; x < GRID_SIZE - shrinkLevel; x++) {
              newRing.push({ x, y: shrinkLevel });
              newRing.push({ x, y: GRID_SIZE - 1 - shrinkLevel });
            }
            for (let y = shrinkLevel + 1; y < GRID_SIZE - 1 - shrinkLevel; y++) {
              newRing.push({ x: shrinkLevel, y });
              newRing.push({ x: GRID_SIZE - 1 - shrinkLevel, y });
            }

            setObstacles(prev => [...prev, ...newRing]);
          }
        } else if (gameTime % 15 !== 0) {
          shrinkMazeRef.current = false;
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isRunning, gameOver, speed, snake, direction, nextDirection, food, specialFood]);
  
  // Update game state
  const updateGame = () => {
    // Update snake position
    setDirection(nextDirection);
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = {...newSnake[0]};
      
      // Move head in current direction
      head.x += direction.x;
      head.y += direction.y;

      // Check teleport zones (Level 4)
      if (level === 4) {
        const teleport = teleportZones.find(zone => zone.x === head.x && zone.y === head.y);
        if (teleport) {
          head.x = teleport.target.x;
          head.y = teleport.target.y;
        }
      }
      
      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        handleGameOver();
        return prevSnake;
      }

      // Check obstacle collision
      if (isPositionObstacle({ x: head.x, y: head.y })) {
        handleGameOver();
        return prevSnake;
      }
      
      // Check moving obstacle collision (Level 3)
      if (level === 3) {
        for (const obstacle of movingObstacles) {
          if (obstacle.x === head.x && obstacle.y === head.y) {
            handleGameOver();
            return prevSnake;
          }
        }
      }
      
      // Level 4: Add score multiplier based on current maze shrink level
      let scoreMultiplier = 1;
      if (level === 4) {
        scoreMultiplier = 1 + (obstacles.length > 76 ? Math.floor((obstacles.length - 76) / 36) * 0.5 : 0);
      }
      
      // Check self collision (skipping the tail as it will move)
      for (let i = 0; i < newSnake.length - 1; i++) {
        if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
          handleGameOver();
          return prevSnake;
        }
      }
      
      // Add new head
      newSnake.unshift(head);
      
      // Check if eating food
      if (food && head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + Math.floor(FOOD_POINTS * scoreMultiplier));
        placeFood();
        // Speed up as snake grows
        setSpeed(prevSpeed => Math.max(MIN_SPEED, prevSpeed - SPEED_INCREMENT));
      } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        setScore(prevScore => prevScore + Math.floor(SPECIAL_FOOD_POINTS * scoreMultiplier));
        setSpecialFood(null);
        
        // Special effect - snake grows extra length
        return newSnake;
      } else {
        // Remove tail if not eating
        newSnake.pop();
      }
      
      return newSnake;
    });
  };
  
  // Handle game over
  const handleGameOver = () => {
    setIsRunning(false);
    setGameOver(true);
    toast.error("Game Over!", { position: "top-center" });
  };
  
  // Toggle game running state
  const toggleRunning = () => {
    if (gameOver) {
      initGame();
      setIsRunning(true);
    } else {
      setIsRunning(prev => !prev);
    }
  };
  
  // Start a new game
  const startNewGame = () => {
    initGame();
    setIsRunning(true);
  };
  
  // Submit score
  const submitScore = () => {
    const finalPlayerName = playerName.trim() || 'Anonymous';
    
    // Save player name
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
    
    // Submit score via prop
    onScoreSubmit({
      playerName: finalPlayerName,
      score,
      date: new Date().toISOString(),
      level,
      snakeLength: snake.length
      snakeLength: snake.length
    
    toast.success(`Score saved: ${score} points!`);
    
    // Reset game
    initGame();
  };
  
  // Draw game on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Use gradient for snake body
      const isHead = index === 0;
      
      if (isHead) {
        // Snake head
        ctx.fillStyle = '#4E8A3D';
      } else {
        // Snake body with gradient
        const gradientIntensity = Math.max(0.6, 1 - index / snake.length);
        ctx.fillStyle = `rgba(78, 138, 61, ${gradientIntensity})`;
      }
      
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      
      // Add eyes to head
      if (isHead) {
        ctx.fillStyle = 'white';
        
        // Position eyes based on direction
        if (direction === DIRECTIONS.RIGHT || direction === DIRECTIONS.LEFT) {
          // Eyes horizontal
          const eyeOffsetX = direction === DIRECTIONS.RIGHT ? 14 : 2;
          ctx.beginPath();
          ctx.arc(segment.x * CELL_SIZE + eyeOffsetX, segment.y * CELL_SIZE + 6, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * CELL_SIZE + eyeOffsetX, segment.y * CELL_SIZE + 14, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Eyes vertical
          const eyeOffsetY = direction === DIRECTIONS.DOWN ? 14 : 2;
          ctx.beginPath();
          ctx.arc(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + eyeOffsetY, 2, 0, Math.PI * 2);
          ctx.arc(segment.x * CELL_SIZE + 14, segment.y * CELL_SIZE + eyeOffsetY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Add rounded corners to snake segments
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = '#333333';
      ctx.fillRect(
        obstacle.x * CELL_SIZE,
        obstacle.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      
      // Add texture to walls
      ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
      ctx.fillRect(
        obstacle.x * CELL_SIZE + 2,
        obstacle.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });
    
    // Draw moving obstacles
    movingObstacles.forEach(obstacle => {
      ctx.fillStyle = '#7209B7';
      ctx.fillRect(
        obstacle.x * CELL_SIZE,
        obstacle.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
      
      // Add pulsing effect to moving obstacles
      const pulseRate = (Date.now() % 800) / 800;
      const pulseAlpha = 0.3 + 0.4 * Math.sin(pulseRate * Math.PI * 2);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
      ctx.fillRect(
        obstacle.x * CELL_SIZE + 4,
        obstacle.y * CELL_SIZE + 4,
        CELL_SIZE - 8,
        CELL_SIZE - 8
      );
    });
    
    // Draw teleport zones
    teleportZones.forEach(zone => {
      const gradient = ctx.createRadialGradient(
        zone.x * CELL_SIZE + CELL_SIZE/2, zone.y * CELL_SIZE + CELL_SIZE/2, 0,
        zone.x * CELL_SIZE + CELL_SIZE/2, zone.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE
      );
      gradient.addColorStop(0, 'rgba(114, 9, 183, 0.8)');
      gradient.addColorStop(1, 'rgba(114, 9, 183, 0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(zone.x * CELL_SIZE, zone.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw food
    if (food) {
      ctx.fillStyle = '#F72585';
      ctx.beginPath();
      ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Add shine to food
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 3,
        food.y * CELL_SIZE + CELL_SIZE / 3,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw special food
    if (specialFood) {
      // Pulsating effect
      const pulseRate = (Date.now() % 1000) / 1000;
      const pulseSize = 0.8 + 0.2 * Math.sin(pulseRate * Math.PI * 2);
      
      ctx.fillStyle = '#7209B7';
      ctx.beginPath();
      ctx.arc(
        specialFood.x * CELL_SIZE + CELL_SIZE / 2,
        specialFood.y * CELL_SIZE + CELL_SIZE / 2,
        (CELL_SIZE / 2 - 2) * pulseSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Star pattern on special food
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      const centerX = specialFood.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = specialFood.y * CELL_SIZE + CELL_SIZE / 2;
      const spikes = 5;
      const outerRadius = CELL_SIZE / 2 - 4;
      const innerRadius = CELL_SIZE / 4;
      
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / spikes;
        const x = centerX + Math.cos(angle) * radius * pulseSize;
        const y = centerY + Math.sin(angle) * radius * pulseSize;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
      
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
    
    // Pause overlay
    if (!isRunning && !gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }, [snake, food, specialFood, obstacles, movingObstacles, teleportZones, isRunning, gameOver, score, direction]);
  
  // Initialize game on first render
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  return (
    <div 
      className="bg-white dark:bg-surface-800 rounded-2xl shadow-card overflow-hidden" 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="p-4 md:p-6 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-primary-dark dark:text-primary-light">
            SlitherSphere
          </h2>

          <span className="text-sm font-medium bg-secondary-light text-white px-3 py-1 rounded-full">
            Level {level}
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
              <TrophyIcon size={16} className="text-secondary mr-2" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
              <ZapIcon size={16} className="text-primary mr-2" />
              <span className="text-sm font-semibold">{Math.floor(1000 / speed)}</span>
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              aria-label="Settings"
            >
              <MenuIcon size={16} />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-surface-50 dark:bg-surface-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-sm">Game Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm mb-1">Level Selection</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((lvl) => {
                        const levelNames = {
                          1: "Classic",
                          2: "Obstacle Course",
                          3: "Speed Demon",
                          4: "Maze Runner"
                        };
                        
                        return (
                          <button
                            key={lvl}
                            onClick={() => changeLevel(lvl)}
                            className={`py-1 text-sm ${
                              level === lvl 
                                ? 'bg-secondary text-white' 
                                : 'bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300'
                            } rounded-lg`}
                          >
                            {levelNames[lvl]}
                          </button>
                        );
                      })}
                    </div>                  
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Difficulty</label>
                      <div className="flex">
                        {['easy', 'medium', 'hard'].map((diffLevel) => (
                          <button
                            key={diffLevel}
                            onClick={() => setDifficulty(diffLevel)}
                            className={`flex-1 py-1 text-sm ${
                              difficulty === diffLevel ? 'bg-primary text-white' : 'bg-surface-200 dark:bg-surface-600 text-surface-700 dark:text-surface-300'
                            } ${diffLevel === 'easy' ? 'rounded-l-lg' : ''} ${diffLevel === 'hard' ? 'rounded-r-lg' : ''}`}
                          >
                            {diffLevel.charAt(0).toUpperCase() + diffLevel.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="playerName" className="block text-sm mb-1">Your Name</label>
                      <input id="playerName"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex items-center">
                  <input
                    id="showControls"
                    type="checkbox"
                    checked={showKeyControls}
                    onChange={() => setShowKeyControls(!showKeyControls)}
                    className="mr-2"
                  />
                  <label htmlFor="showControls" className="text-sm">
                    Show on-screen controls
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="game-canvas mx-auto"
          />
          
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg p-5 max-w-xs w-full mx-auto">
                <h3 className="text-xl font-bold text-center mb-2">Game Over!</h3>
                <p className="text-center mb-4">
                  Your final score: <span className="font-bold text-lg">{score}</span>
                  <br />
                  <span className="text-sm text-surface-500">Level {level}: {level === 1 ? "Classic" : level === 2 ? "Obstacle Course" : level === 3 ? "Speed Demon" : "Maze Runner"}</span>
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={startNewGame}
                    className="flex-1 btn btn-primary"
                  >
                    Play Again
                  </button>
                  
                  <button
                    onClick={submitScore}
                    className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <SaveIcon size={16} />
                    <span>Save Score</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleRunning}
              className="btn btn-primary flex items-center justify-center gap-2"
              aria-label={isRunning ? "Pause" : "Play"}
            >
              {isRunning ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              <span>{isRunning ? "Pause" : gameOver ? "New Game" : "Play"}</span>
            </button>
            
            {!gameOver && isRunning && (
              <button
                onClick={startNewGame}
                className="p-3 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                aria-label="Restart"
              >
                <RefreshCwIcon size={18} />
              </button>
            )}
          </div>
          
          {showKeyControls && (
            <div className="flex-1 flex flex-col items-center md:justify-end">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-start-2">
                  <button
                    onClick={() => handleDirectionButton(DIRECTIONS.UP)}
                    className="game-control"
                    aria-label="Move Up"
                  >
                    <ChevronUpIcon size={24} />
                  </button>
                </div>
                <div className="col-start-1 col-end-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDirectionButton(DIRECTIONS.LEFT)}
                    className="game-control"
                    aria-label="Move Left"
                  >
                    <ChevronLeftIcon size={24} />
                  </button>
                  <button
                    onClick={() => handleDirectionButton(DIRECTIONS.DOWN)}
                    className="game-control"
                    aria-label="Move Down"
                  >
                    <ChevronDownIcon size={24} />
                  </button>
                  <button
                    onClick={() => handleDirectionButton(DIRECTIONS.RIGHT)}
                    className="game-control"
                    aria-label="Move Right"
                  >
                    <ChevronRightIcon size={24} />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
            <div className="flex items-center">
              <ZapIcon size={16} className="text-primary mr-1" />
              <span className="text-sm font-medium">
                Snake Length: {snake.length}
              </span>
            </div>
            <div className="text-sm font-medium">
              Level: {level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainFeature;
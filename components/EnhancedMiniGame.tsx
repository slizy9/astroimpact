import { useState, useEffect, useRef } from 'react';

interface AsteroidParams {
  size: number;
  velocity: number;
  angle: number;
  mass: number;
  name: string;
}

interface EnhancedMiniGameProps {
  asteroidParams?: AsteroidParams;
  onGameEnd?: (score: number, asteroidsDestroyed: number) => void;
}

export function EnhancedMiniGame({ asteroidParams, onGameEnd }: EnhancedMiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    asteroids: [] as any[],
    missiles: [] as any[],
    score: 0,
    asteroidsDestroyed: 0,
    missilesFired: 0,
    gameRunning: false,
    animationId: 0,
    gameTime: 0,
    timeRemaining: 90, // 1:30 minutes in seconds
    gameEnded: false,
    gameWon: false,
    lastTimeUpdate: 0, // Track last time update for timer
    gamePaused: false, // Pause game when asteroid is selected
    selectedAsteroid: null // Currently selected asteroid for info display
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      // Ensure minimum canvas size
      canvas.width = Math.max(rect.width, 400);
      canvas.height = Math.max(rect.height, 300);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create asteroid
    const createAsteroid = (): any => {
      const side = Math.floor(Math.random() * 3); // Only 3 sides (top, left, right)
      let x, y, vx, vy;
      
      // Use asteroid parameters if available (larger and slower)
      const asteroidSize = asteroidParams ? 
        Math.max(asteroidParams.size / 500, 15) : // Scale down for game, but larger minimum
        Math.random() * 25 + 20; // Much larger asteroids (20-45px)
      
      // Slower, more controllable asteroids
      const asteroidSpeed = asteroidParams ?
        Math.max(asteroidParams.velocity / 30, 0.6) : // Slower baseline
        Math.random() * 0.9 + 0.6; // 0.6 - 1.5 px/frame
      
      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = -20;
          vx = (Math.random() - 0.5) * 1.2; // reduce lateral jitter
          vy = asteroidSpeed;
          break;
        case 1: // Right
          x = canvas.width + 20;
          y = Math.random() * canvas.height;
          vx = -asteroidSpeed;
          vy = (Math.random() - 0.5) * 1.2; // reduce lateral jitter
          break;
        default: // Left
          x = -20;
          y = Math.random() * canvas.height;
          vx = asteroidSpeed;
          vy = (Math.random() - 0.5) * 1.2; // reduce lateral jitter
      }

      return {
        x, y, vx, vy,
        radius: asteroidSize,
        destroyed: false,
        name: asteroidParams?.name || 'Asteroid'
      };
    };

    const createMissile = (targetX: number, targetY: number): any => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height - 30; // Fire from Earth's center
      
      const dx = targetX - centerX;
      const dy = targetY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Prevent division by zero
      if (distance === 0) {
        return {
          x: centerX,
          y: centerY,
          vx: 0,
          vy: -8, // Shoot straight up if clicking on center (slower)
          radius: 3,
          active: true,
          length: 20,
          angle: -Math.PI / 2,
          startTime: Date.now()
        };
      }
      
      console.log('Creando láser desde:', centerX, centerY, 'hacia:', targetX, targetY); // Debug log
      
      return {
        x: centerX,
        y: centerY,
        vx: (dx / distance) * 8, // Slower laser speed for better visibility
        vy: (dy / distance) * 8,
        radius: 3, // Larger impact point
        active: true,
        length: 30, // Longer laser beam for visibility
        angle: Math.atan2(dy, dx), // Direction angle for laser beam
        startTime: Date.now() // Track when laser was created
      };
    };

    const updateGame = () => {
      const state = gameStateRef.current;
      
      // Apply slow-motion when paused (do not fully stop the game)
      const speedFactor = state.gamePaused ? 0.25 : 1;
      
      // Update timer (more accurate timing)
      if (state.gameRunning && !state.gameEnded) {
        const currentTime = Date.now();
        
        // Use actual time instead of frame counting for more accuracy
        if (state.lastTimeUpdate === 0) {
          state.lastTimeUpdate = currentTime;
        }
        
        const timeElapsed = currentTime - state.lastTimeUpdate;
        if (timeElapsed >= 1000) { // 1 second has passed
          state.timeRemaining--;
          state.lastTimeUpdate = currentTime;
          
          console.log('Tiempo restante:', state.timeRemaining); // Debug log
          
          // Check if time is up
          if (state.timeRemaining <= 0) {
            state.gameEnded = true;
            state.gameWon = true; // Win if no asteroids hit Earth
            state.gameRunning = false;
            console.log('¡Tiempo agotado! ¡Victoria!'); // Debug log
            if (onGameEnd) {
              onGameEnd(state.score, state.asteroidsDestroyed);
            }
            return;
          }
        }
      }
      
      // Spawn asteroids (adjusted; slower rate by default, even slower in pause)
      const baseSpawnRate = asteroidParams ? 
        Math.max(0.003, asteroidParams.mass / 8000000) :
        0.005;
      const spawnRate = baseSpawnRate * (state.gamePaused ? 0.5 : 1);
      
      if (Math.random() < spawnRate && !state.gameEnded) {
        state.asteroids.push(createAsteroid());
      }

      // Update asteroids (respect slow-motion)
      state.asteroids.forEach(asteroid => {
        if (!asteroid.destroyed) {
          asteroid.x += asteroid.vx * speedFactor;
          asteroid.y += asteroid.vy * speedFactor;
          
          // Check collision with Earth (blue circle)
          const earthX = canvas.width / 2;
          const earthY = canvas.height - 30;
          const earthRadius = 25;
          
          const dx = asteroid.x - earthX;
          const dy = asteroid.y - earthY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < asteroid.radius + earthRadius) {
            // Asteroid hit Earth - Game Over
            state.gameEnded = true;
            state.gameWon = false;
            state.gameRunning = false;
            if (onGameEnd) {
              onGameEnd(state.score, state.asteroidsDestroyed);
            }
            return;
          }
        }
      });

      // Update missiles (respect slow-motion)
      state.missiles.forEach(missile => {
        if (missile.active) {
          missile.x += missile.vx * speedFactor;
          missile.y += missile.vy * speedFactor;
          
          // Remove missiles that are off screen
          if (missile.x < 0 || missile.x > canvas.width || 
              missile.y < 0 || missile.y > canvas.height) {
            missile.active = false;
          }
        }
      });

      // Check collisions
      state.missiles.forEach(missile => {
        if (!missile.active) return;
        
        state.asteroids.forEach(asteroid => {
          if (asteroid.destroyed) return;
          
          const dx = missile.x - asteroid.x;
          const dy = missile.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < asteroid.radius + missile.radius) {
            asteroid.destroyed = true;
            missile.active = false;
            state.score += 10;
            state.asteroidsDestroyed++;
            updateUI();
          }
        });
      });

      // Remove destroyed asteroids and inactive missiles
      state.asteroids = state.asteroids.filter(asteroid => !asteroid.destroyed);
      state.missiles = state.missiles.filter(missile => missile.active);
      
      // Update game time
      state.gameTime++;
    };

    const drawGame = () => {
      const state = gameStateRef.current;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw timer (improved display)
      const minutes = Math.floor(state.timeRemaining / 60);
      const seconds = state.timeRemaining % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      ctx.fillStyle = state.timeRemaining > 30 ? '#10B981' : state.timeRemaining > 10 ? '#F59E0B' : '#EF4444';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`⏱️ ${timeString}`, canvas.width / 2, 40);
      
      // Draw crosshair when game is running
      if (state.gameRunning && !state.gameEnded) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        
        // Draw crosshair lines
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 20, canvas.height - 50);
        ctx.lineTo(canvas.width / 2 + 20, canvas.height - 50);
        ctx.moveTo(canvas.width / 2, canvas.height - 70);
        ctx.lineTo(canvas.width / 2, canvas.height - 30);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset line dash
        
        // Draw "Click to shoot" text
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔫 Click anywhere to shoot!', canvas.width / 2, 80);
      }
      
      // Draw asteroid info if selected
      if (state.selectedAsteroid && state.gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📊 Asteroid Information', canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText(`Name: ${state.selectedAsteroid.name}`, canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText(`Size: ${Math.round(state.selectedAsteroid.radius * 2)}px`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(`Speed: ${Math.round(Math.sqrt(state.selectedAsteroid.vx**2 + state.selectedAsteroid.vy**2) * 100)/100}px/frame`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Click anywhere to continue', canvas.width / 2, canvas.height / 2 + 60);
      }
      
      // Draw game status
      if (state.gameEnded) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = state.gameWon ? '#10B981' : '#EF4444';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(state.gameWon ? '🎉 VICTORY!' : '💥 GAME OVER', canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(state.gameWon ? '¡Protegiste la Tierra!' : 'Un asteroide impactó la Tierra', canvas.width / 2, canvas.height / 2 + 40);
      }
      
      // Draw Earth (bottom center)
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height - 30, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw asteroids (larger meteorites)
      state.asteroids.forEach(asteroid => {
        if (!asteroid.destroyed) {
          // Gradient effect for larger meteorites
          const gradient = ctx.createRadialGradient(
            asteroid.x - asteroid.radius/3, asteroid.y - asteroid.radius/3, 0,
            asteroid.x, asteroid.y, asteroid.radius
          );
          
          // Color based on asteroid parameters
          const baseColor = asteroidParams ? 
            (asteroidParams.mass > 50000 ? '#8B4513' : '#A0522D') : // Heavier = darker
            '#8B4513';
          
          gradient.addColorStop(0, '#FF6B35'); // Hot core
          gradient.addColorStop(0.7, baseColor); // Main color
          gradient.addColorStop(1, '#2C1810'); // Dark edge
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow effect for larger meteorites
          ctx.shadowColor = '#FF6B35';
          ctx.shadowBlur = 10;
          ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
          ctx.beginPath();
          ctx.arc(asteroid.x, asteroid.y, asteroid.radius + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
          
          // Add asteroid name if it's the special one
          if (asteroid.name !== 'Asteroid') {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(asteroid.name, asteroid.x, asteroid.y - asteroid.radius - 8);
          }
        }
      });

      // Draw laser beams (improved visibility)
      state.missiles.forEach(missile => {
        if (missile.active) {
          // Laser beam (thicker, more visible line)
          ctx.strokeStyle = '#00FFFF'; // Cyan laser color
          ctx.lineWidth = 5; // Thicker line
          ctx.lineCap = 'round';
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = 15; // Glow effect
          ctx.beginPath();
          ctx.moveTo(missile.x, missile.y);
          ctx.lineTo(missile.x - missile.vx * missile.length, missile.y - missile.vy * missile.length);
          ctx.stroke();
          
          // Laser core (brighter line)
          ctx.strokeStyle = '#FFFFFF'; // White core
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0; // No shadow for core
          ctx.beginPath();
          ctx.moveTo(missile.x, missile.y);
          ctx.lineTo(missile.x - missile.vx * missile.length, missile.y - missile.vy * missile.length);
          ctx.stroke();
          
          // Laser impact point (larger, more visible)
          ctx.fillStyle = '#00FFFF';
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(missile.x, missile.y, missile.radius * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Reset shadow
          ctx.shadowBlur = 0;
        }
      });
    };

    const updateUI = () => {
      const state = gameStateRef.current;
      const scoreElement = document.getElementById('gameScore');
      const asteroidsElement = document.getElementById('asteroidsDestroyed');
      const missilesElement = document.getElementById('missilesFired');
      const accuracyElement = document.getElementById('accuracy');
      
      if (scoreElement) scoreElement.textContent = state.score.toString();
      if (asteroidsElement) asteroidsElement.textContent = state.asteroidsDestroyed.toString();
      if (missilesElement) missilesElement.textContent = state.missilesFired.toString();
      
      const accuracy = state.missilesFired > 0 ? 
        Math.round((state.asteroidsDestroyed / state.missilesFired) * 100) : 0;
      if (accuracyElement) accuracyElement.textContent = accuracy + '%';
    };

    const gameLoop = () => {
      updateGame();
      drawGame();
      gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
    };

    const startGame = () => {
      console.log('Starting game...'); // Debug log
      gameStateRef.current.gameRunning = true;
      gameStateRef.current.score = 0;
      gameStateRef.current.asteroidsDestroyed = 0;
      gameStateRef.current.missilesFired = 0;
      gameStateRef.current.asteroids = [];
      gameStateRef.current.missiles = [];
      gameStateRef.current.gameTime = 0;
      gameStateRef.current.timeRemaining = 90; // Reset timer to 1:30
      gameStateRef.current.gameEnded = false;
      gameStateRef.current.gameWon = false;
      gameStateRef.current.lastTimeUpdate = 0; // Reset timer
      gameStateRef.current.gamePaused = false; // Reset pause state
      gameStateRef.current.selectedAsteroid = null; // Reset selected asteroid
      updateUI();
      gameLoop();
    };

    const stopGame = () => {
      gameStateRef.current.gameRunning = false;
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
      
      // Call onGameEnd callback
      if (onGameEnd) {
        onGameEnd(
          gameStateRef.current.score,
          gameStateRef.current.asteroidsDestroyed
        );
      }
    };

    // Event listeners
    const handleCanvasClick = (e: MouseEvent) => {
      const state = gameStateRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log('Click detected at:', x, y, 'Game running:', state.gameRunning, 'Game ended:', state.gameEnded); // Debug log

      // Check if game is paused (resume game)
      if (state.gamePaused) {
        state.gamePaused = false;
        state.selectedAsteroid = null;
        console.log('Game resumed');
        return;
      }
      
      // Auto-start game on first click if not running yet
      if (!state.gameRunning && !state.gameEnded) {
        startGame();
        return;
      }

      // Check if clicking on an asteroid (for info display)
      if (state.gameRunning && !state.gameEnded) {
        let clickedAsteroid = null;
        for (const asteroid of state.asteroids) {
          if (!asteroid.destroyed) {
            const dx = x - asteroid.x;
            const dy = y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= asteroid.radius) {
              clickedAsteroid = asteroid;
              break;
            }
          }
        }
        
        if (clickedAsteroid) {
          // Clicked on asteroid - show info and pause game
          state.selectedAsteroid = clickedAsteroid;
          state.gamePaused = true;
          console.log('Asteroid selected:', clickedAsteroid.name);
        } else {
          // Clicked on empty space - shoot laser
          console.log('Firing laser towards:', x, y); // Debug log
          state.missiles.push(createMissile(x, y));
          state.missilesFired++;
          updateUI();
        }
      } else {
        console.log('Cannot fire - game not active or already ended');
      }
    };

    const handleStartButton = () => {
      const btn = document.getElementById('startGameBtn');
      if (btn) {
        if (gameStateRef.current.gameRunning) {
          stopGame();
          btn.textContent = '🚀 Iniciar Juego';
        } else {
          startGame();
          btn.textContent = '⏸️ Pausar Juego';
        }
      }
    };

    // Start the game loop
    gameLoop();

    canvas.addEventListener('click', handleCanvasClick);
    
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
      startBtn.addEventListener('click', handleStartButton);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleCanvasClick);
      if (startBtn) {
        startBtn.removeEventListener('click', handleStartButton);
      }
      stopGame();
    };
  }, [asteroidParams, onGameEnd]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ background: 'linear-gradient(180deg, #000428 0%, #004e92 100%)' }}
    />
  );
}

export default EnhancedMiniGame;
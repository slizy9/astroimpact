import { useEffect, useRef } from 'react';

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  destroyed: boolean;
}

interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    asteroids: [] as Asteroid[],
    missiles: [] as Missile[],
    score: 0,
    asteroidsDestroyed: 0,
    missilesFired: 0,
    gameRunning: false,
    animationId: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game functions
    const createAsteroid = (): Asteroid => {
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      
      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = -20;
          vx = (Math.random() - 0.5) * 2;
          vy = Math.random() * 2 + 1;
          break;
        case 1: // Right
          x = canvas.width + 20;
          y = Math.random() * canvas.height;
          vx = -(Math.random() * 2 + 1);
          vy = (Math.random() - 0.5) * 2;
          break;
        case 2: // Bottom
          x = Math.random() * canvas.width;
          y = canvas.height + 20;
          vx = (Math.random() - 0.5) * 2;
          vy = -(Math.random() * 2 + 1);
          break;
        default: // Left
          x = -20;
          y = Math.random() * canvas.height;
          vx = Math.random() * 2 + 1;
          vy = (Math.random() - 0.5) * 2;
      }

      return {
        x, y, vx, vy,
        radius: Math.random() * 15 + 10,
        destroyed: false
      };
    };

    const createMissile = (targetX: number, targetY: number): Missile => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height - 50;
      
      const dx = targetX - centerX;
      const dy = targetY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return {
        x: centerX,
        y: centerY,
        vx: (dx / distance) * 8,
        vy: (dy / distance) * 8,
        radius: 3,
        active: true
      };
    };

    const updateGame = () => {
      const state = gameStateRef.current;
      
      // Spawn asteroids
      if (Math.random() < 0.02) {
        state.asteroids.push(createAsteroid());
      }

      // Update asteroids
      state.asteroids.forEach(asteroid => {
        if (!asteroid.destroyed) {
          asteroid.x += asteroid.vx;
          asteroid.y += asteroid.vy;
        }
      });

      // Update missiles
      state.missiles.forEach(missile => {
        if (missile.active) {
          missile.x += missile.vx;
          missile.y += missile.vy;
          
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
    };

    const drawGame = () => {
      const state = gameStateRef.current;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Earth (bottom center)
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height - 30, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw asteroids
      state.asteroids.forEach(asteroid => {
        if (!asteroid.destroyed) {
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Add some detail
          ctx.fillStyle = '#A0522D';
          ctx.beginPath();
          ctx.arc(asteroid.x - 5, asteroid.y - 5, asteroid.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw missiles
      state.missiles.forEach(missile => {
        if (missile.active) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Missile trail
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.arc(missile.x - missile.vx * 2, missile.y - missile.vy * 2, missile.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
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
      if (gameStateRef.current.gameRunning) {
        updateGame();
        drawGame();
        gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
      }
    };

    const startGame = () => {
      gameStateRef.current.gameRunning = true;
      gameStateRef.current.score = 0;
      gameStateRef.current.asteroidsDestroyed = 0;
      gameStateRef.current.missilesFired = 0;
      gameStateRef.current.asteroids = [];
      gameStateRef.current.missiles = [];
      updateUI();
      gameLoop();
    };

    const stopGame = () => {
      gameStateRef.current.gameRunning = false;
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };

    // Event listeners
    const handleCanvasClick = (e: MouseEvent) => {
      if (!gameStateRef.current.gameRunning) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      gameStateRef.current.missiles.push(createMissile(x, y));
      gameStateRef.current.missilesFired++;
      updateUI();
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
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ background: 'linear-gradient(180deg, #000428 0%, #004e92 100%)' }}
    />
  );
}

export default MiniGame;

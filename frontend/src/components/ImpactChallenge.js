import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trophy, Target, Heart, Zap, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export function ImpactChallenge({ selectedCharityName }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle'); // idle, playing, scored, missed
  const [power, setPower] = useState(0);
  const [angle, setAngle] = useState(45);
  const [score, setScore] = useState(0);
  const [playsToday, setPlaysToday] = useState(0);
  const [totalImpact, setTotalImpact] = useState(0);
  const [isPowerCharging, setIsPowerCharging] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 100, y: 350 });
  const [ballVelocity, setBallVelocity] = useState({ x: 0, y: 0 });
  const [isRolling, setIsRolling] = useState(false);

  const MAX_PLAYS_PER_DAY = 5;
  const IMPACT_PER_POINT = 0.5; // $0.50 per point scored

  useEffect(() => {
    loadGameStats();
  }, []);

  useEffect(() => {
    if (!isRolling) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw green
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 300, canvas.width, 100);

      // Draw grass texture
      ctx.strokeStyle = '#166534';
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, 300 + Math.random() * 100);
        ctx.lineTo(Math.random() * canvas.width, 300 + Math.random() * 100);
        ctx.stroke();
      }

      // Draw hole
      const holeX = canvas.width - 100;
      const holeY = 350;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(holeX, holeY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw flag
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(holeX, holeY - 60);
      ctx.lineTo(holeX, holeY);
      ctx.stroke();

      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(holeX, holeY - 60);
      ctx.lineTo(holeX + 25, holeY - 45);
      ctx.lineTo(holeX, holeY - 30);
      ctx.closePath();
      ctx.fill();

      // Update ball physics
      setBallPosition(prev => {
        const newX = prev.x + ballVelocity.x;
        const newY = prev.y + ballVelocity.y;

        // Check if ball reached hole
        const distanceToHole = Math.sqrt(
          Math.pow(newX - holeX, 2) + Math.pow(newY - holeY, 2)
        );

        if (distanceToHole < 25) {
          setIsRolling(false);
          handleScore(true);
          return { x: holeX, y: holeY };
        }

        // Check boundaries
        if (newX > canvas.width - 20 || newY < 300 || newY > 380) {
          setIsRolling(false);
          handleScore(false);
          return prev;
        }

        return { x: newX, y: newY };
      });

      setBallVelocity(prev => ({
        x: prev.x * 0.98, // Friction
        y: prev.y * 0.98,
      }));

      // Stop if ball is too slow
      if (Math.abs(ballVelocity.x) < 0.1 && Math.abs(ballVelocity.y) < 0.1) {
        setIsRolling(false);
        if (gameState === 'playing') {
          handleScore(false);
        }
      }

      // Draw ball
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(ballPosition.x, ballPosition.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw dimples
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const dimpleAngle = (Math.PI * 2 * i) / 8;
        const dimpleX = ballPosition.x + Math.cos(dimpleAngle) * 4;
        const dimpleY = ballPosition.y + Math.sin(dimpleAngle) * 4;
        ctx.beginPath();
        ctx.arc(dimpleX, dimpleY, 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isRolling, ballPosition, ballVelocity, gameState]);

  const loadGameStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const plays = parseInt(localStorage.getItem(`plays_${today}`) || '0');
      const impact = parseFloat(localStorage.getItem('total_impact') || '0');
      setPlaysToday(plays);
      setTotalImpact(impact);
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  };

  const handleScore = async (scored) => {
    if (scored) {
      const points = Math.floor(50 + Math.random() * 50); // 50-100 points
      setScore(prev => prev + points);
      setGameState('scored');
      
      const impactAmount = points * IMPACT_PER_POINT;
      const newTotalImpact = totalImpact + impactAmount;
      setTotalImpact(newTotalImpact);
      localStorage.setItem('total_impact', newTotalImpact.toString());

      toast.success(`🎉 HOLE IN ONE! +${points} points = $${impactAmount.toFixed(2)} to charity!`);

      // Save to backend
      try {
        await axios.post(
          `${API_URL}/api/impact-challenge/score`,
          { points, impact_amount: impactAmount },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error saving score:', error);
      }
    } else {
      setGameState('missed');
      toast.error('Missed! Try again!');
    }
  };

  const startPowerCharge = () => {
    if (playsToday >= MAX_PLAYS_PER_DAY) {
      toast.error(`Daily limit reached! Come back tomorrow for ${MAX_PLAYS_PER_DAY} more plays.`);
      return;
    }

    if (gameState === 'playing' || isRolling) return;

    setIsPowerCharging(true);
    setPower(0);

    const chargeInterval = setInterval(() => {
      setPower(prev => {
        if (prev >= 100) {
          clearInterval(chargeInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const stopCharge = () => {
      clearInterval(chargeInterval);
      setIsPowerCharging(false);
      shoot();
      document.removeEventListener('mouseup', stopCharge);
      document.removeEventListener('touchend', stopCharge);
    };

    document.addEventListener('mouseup', stopCharge);
    document.addEventListener('touchend', stopCharge);
  };

  const shoot = () => {
    if (power < 10) return;

    setGameState('playing');
    setIsRolling(true);

    const radians = (angle * Math.PI) / 180;
    const speed = (power / 100) * 8;

    setBallVelocity({
      x: Math.cos(radians) * speed,
      y: -Math.sin(radians) * speed * 0.3,
    });

    const today = new Date().toISOString().split('T')[0];
    const newPlays = playsToday + 1;
    setPlaysToday(newPlays);
    localStorage.setItem(`plays_${today}`, newPlays.toString());
  };

  const resetGame = () => {
    setGameState('idle');
    setPower(0);
    setBallPosition({ x: 100, y: 350 });
    setBallVelocity({ x: 0, y: 0 });
    setIsRolling(false);
  };

  return (
    <Card className="bg-card border-border p-8 relative overflow-hidden" data-testid="impact-challenge-card">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-outfit font-bold">Impact Challenge</h3>
              <p className="text-sm text-muted-foreground">Play daily to boost your charity impact!</p>
            </div>
          </div>
          
          <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-2">
            {MAX_PLAYS_PER_DAY - playsToday} plays left today
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Trophy className="w-4 h-4" />
              <span>Today's Score</span>
            </div>
            <div className="text-3xl font-outfit font-bold text-primary">{score}</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Heart className="w-4 h-4" />
              <span>Total Impact</span>
            </div>
            <div className="text-3xl font-outfit font-bold text-green-500">
              ${totalImpact.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="w-4 h-4" />
              <span>Supporting</span>
            </div>
            <div className="text-sm font-semibold text-foreground/80 truncate">
              {selectedCharityName || 'Select a charity'}
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-gradient-to-b from-blue-900/20 to-green-900/20 rounded-xl p-4 mb-6 border border-border">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Angle Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Angle: {angle}°</label>
            </div>
            <input
              type="range"
              min="20"
              max="70"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              disabled={isRolling}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #F43F5E ${angle}%, #3f3f46 ${angle}%)`,
              }}
            />
          </div>

          {/* Power Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Power: {power}%</label>
            </div>
            <div className="w-full h-4 bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                style={{ width: `${power}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onMouseDown={startPowerCharge}
              onTouchStart={startPowerCharge}
              disabled={playsToday >= MAX_PLAYS_PER_DAY || isRolling}
              className="flex-1 py-6 text-lg bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            >
              {isPowerCharging ? (
                'Release to Shoot!'
              ) : isRolling ? (
                'Ball Rolling...'
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Hold to Charge Power
                </>
              )}
            </Button>
            
            {(gameState === 'scored' || gameState === 'missed') && (
              <Button
                onClick={resetGame}
                variant="outline"
                className="px-6 py-6"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
          <h4 className="text-sm font-semibold mb-2 text-primary">How to Play:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>🎯 Adjust the angle slider to aim your shot</li>
            <li>⚡ Hold the "Charge Power" button to build power (release to shoot)</li>
            <li>🏆 Land in the hole to earn points for your selected charity!</li>
            <li>💚 Each point = ${IMPACT_PER_POINT.toFixed(2)} donated to {selectedCharityName || 'your charity'}</li>
            <li>🎮 Play up to {MAX_PLAYS_PER_DAY} times per day</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export function HoleInOneCelebration({ prizeAmount, onClose }) {
  const [showBall, setShowBall] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Sequence the animations
    setTimeout(() => setShowBall(true), 300);
    setTimeout(() => setShowConfetti(true), 1500);
    setTimeout(() => setShowCelebration(true), 1800);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                backgroundColor: [
                  '#F43F5E',
                  '#EC4899',
                  '#FCD34D',
                  '#34D399',
                  '#60A5FA',
                  '#A78BFA',
                ][Math.floor(Math.random() * 6)],
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Golf Course Scene */}
      <div className="relative w-full max-w-2xl mx-auto px-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Golf Scene Container */}
        <div className="relative h-96 mb-8">
          {/* Sky gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-green-900/20 rounded-3xl"></div>

          {/* Golf Course Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-800 to-green-700 rounded-b-3xl">
            {/* Grass texture effect */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 w-1 bg-green-600"
                  style={{
                    left: `${i * 5}%`,
                    height: `${10 + Math.random() * 20}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Golf Hole */}
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
            style={{ perspective: '1000px' }}
          >
            {/* Hole with 3D effect */}
            <div className="relative w-24 h-16">
              <div className="absolute inset-0 bg-zinc-900 rounded-full shadow-2xl shadow-black/50"
                   style={{ transform: 'rotateX(60deg)' }}>
                {/* Inner shadow */}
                <div className="absolute inset-2 bg-black rounded-full"></div>
              </div>
              
              {/* Flag */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-2 h-24 bg-white shadow-lg">
                <div 
                  className="absolute top-0 left-2 w-12 h-8 bg-primary shadow-lg"
                  style={{ 
                    clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
                    animation: 'flagWave 2s ease-in-out infinite'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Golf Ball Animation */}
          {showBall && (
            <div
              className="absolute w-6 h-6 rounded-full bg-white shadow-2xl"
              style={{
                animation: 'ballLanding 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                left: '20%',
                top: '20%',
              }}
            >
              {/* Ball dimples */}
              <div className="absolute inset-1 rounded-full border-2 border-zinc-200 opacity-30"></div>
              <div className="absolute inset-2 rounded-full border border-zinc-300 opacity-20"></div>
            </div>
          )}

          {/* Impact Ripple Effect */}
          {showCelebration && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Celebration Message */}
        {showCelebration && (
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-6 shadow-2xl shadow-yellow-500/50">
              <Trophy className="w-8 h-8 text-white" />
              <span className="text-2xl font-outfit font-bold text-white">HOLE IN ONE!</span>
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-5xl font-outfit font-black mb-4 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
              5-Number Match!
            </h2>
            
            <p className="text-2xl text-zinc-300 mb-6">
              Congratulations! You've achieved perfection!
            </p>

            <div className="inline-block p-8 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-yellow-500/30 rounded-2xl shadow-2xl mb-8">
              <div className="text-sm text-zinc-400 uppercase tracking-widest mb-2">Your Prize</div>
              <div className="text-6xl font-outfit font-bold text-yellow-500 mb-2">
                ${prizeAmount?.toLocaleString() || '0'}
              </div>
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Jackpot Winner!</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 text-zinc-400 text-sm mb-8">
              <p>✨ You matched all 5 numbers perfectly</p>
              <p>🏆 You're among the elite winners this month</p>
              <p>💰 Payment verification in progress</p>
            </div>

            <Button
              onClick={onClose}
              size="lg"
              className="px-12 py-6 text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold shadow-2xl shadow-yellow-500/50"
            >
              Claim Your Victory!
            </Button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes ballLanding {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          20% {
            transform: translate(100px, -50px) scale(0.9);
          }
          40% {
            transform: translate(200px, 20px) scale(0.8);
          }
          60% {
            transform: translate(280px, -30px) scale(0.7);
          }
          80% {
            transform: translate(340px, 10px) scale(0.6);
          }
          90% {
            transform: translate(370px, 50px) scale(0.5);
          }
          95% {
            transform: translate(380px, 80px) scale(0.3);
          }
          100% {
            transform: translate(385px, 100px) scale(0);
            opacity: 0;
          }
        }

        @keyframes flagWave {
          0%, 100% {
            transform: skewY(0deg);
          }
          50% {
            transform: skewY(3deg);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

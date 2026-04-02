import { useEffect, useState } from 'react';

export function GolfPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const timeout = setTimeout(() => {
      setShowAnimation(false);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-pink-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="10" cy="12" r="5" fill="currentColor" />
                <line x1="18" y1="6" x2="21" y2="3" strokeLinecap="round" />
                <line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round" />
                <line x1="18" y1="18" x2="21" y2="21" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <span className="text-5xl font-outfit font-bold text-foreground">Lively</span>
        </div>

        {/* Golf Animation Container */}
        <div className="relative w-[400px] h-[300px] mx-auto mb-8">
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-900 to-green-700 rounded-full"></div>
          
          <div className="absolute bottom-0 right-20 w-8 h-8 bg-zinc-900 rounded-full border-4 border-zinc-700 shadow-inner" style={{ transform: 'translateY(50%)' }}>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-1 h-16 bg-zinc-400">
              <div className="absolute top-0 left-1 w-6 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}></div>
            </div>
          </div>

          <div 
            className="absolute bottom-2 left-20 transition-all duration-1000"
            style={{ animation: 'swing 2s ease-in-out infinite' }}
          >
            <div className="absolute w-6 h-6 rounded-full bg-zinc-300 -top-10 left-1"></div>
            <div className="absolute w-1 h-12 bg-zinc-300 -top-4 left-3"></div>
            <div 
              className="absolute w-12 h-1 bg-zinc-300 origin-left"
              style={{ top: '-2px', left: '3px', animation: 'armSwing 2s ease-in-out infinite' }}
            ></div>
            <div 
              className="absolute w-16 h-1 bg-zinc-400 origin-left"
              style={{ top: '-2px', left: '15px', animation: 'clubSwing 2s ease-in-out infinite' }}
            ></div>
            <div className="absolute w-1 h-8 bg-zinc-300" style={{ top: '8px', left: '1px' }}></div>
            <div className="absolute w-1 h-8 bg-zinc-300" style={{ top: '8px', left: '5px' }}></div>
          </div>

          <div 
            className="absolute w-3 h-3 rounded-full bg-white shadow-lg"
            style={{ bottom: '8px', animation: 'ballFlight 2s ease-in-out infinite' }}
          ></div>
        </div>

        <div className="space-y-4">
          <p className="text-xl text-muted-foreground font-outfit">
            <span className="inline-block animate-pulse">loading your impact</span>
            <span className="inline-block animate-bounce ml-1">.</span>
            <span className="inline-block animate-bounce ml-1" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="inline-block animate-bounce ml-1" style={{ animationDelay: '0.4s' }}>.</span>
          </p>
          
          <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-pink-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 50% { transform: rotate(0deg); } }
        @keyframes armSwing { 0%, 100% { transform: rotate(-30deg); } 25% { transform: rotate(-90deg); } 50% { transform: rotate(-30deg); } }
        @keyframes clubSwing { 0%, 100% { transform: rotate(-45deg); } 25% { transform: rotate(-120deg); } 50% { transform: rotate(-45deg); } }
        @keyframes ballFlight { 0% { left: 120px; bottom: 8px; opacity: 1; } 20% { left: 150px; bottom: 8px; } 30% { left: 200px; bottom: 80px; opacity: 1; } 50% { left: 280px; bottom: 60px; } 70% { left: 320px; bottom: 20px; } 80%, 100% { left: 340px; bottom: 8px; opacity: 0; } }
      `}</style>
    </div>
  );
}

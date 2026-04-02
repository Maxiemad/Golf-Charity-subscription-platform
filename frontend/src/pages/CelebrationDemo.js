import { useState } from 'react';
import { HoleInOneCelebration } from '../components/HoleInOneCelebration';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Trophy } from 'lucide-react';

export function CelebrationDemo() {
  const [showCelebration, setShowCelebration] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      {showCelebration && (
        <HoleInOneCelebration
          prizeAmount={25000}
          onClose={() => setShowCelebration(false)}
        />
      )}

      <Card className="bg-zinc-900 border-white/10 p-12 max-w-2xl">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-outfit font-bold mb-4">
            Hole-in-One Celebration Demo
          </h1>
          
          <p className="text-zinc-400 mb-8 text-lg">
            Click the button below to see the amazing celebration animation that plays when a user wins a 5-match draw!
          </p>

          <div className="space-y-4 mb-8 text-left bg-zinc-800/50 p-6 rounded-xl">
            <h3 className="font-semibold text-primary">Animation Features:</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✅ Animated golf ball landing into hole</li>
              <li>✅ 50+ colorful confetti particles</li>
              <li>✅ 3D golf course with flag</li>
              <li>✅ Prize amount display with glow effect</li>
              <li>✅ Trophy badges and celebration text</li>
              <li>✅ Smooth sequential animations</li>
              <li>✅ Auto-dismissible with close button</li>
            </ul>
          </div>

          <Button
            size="lg"
            onClick={() => setShowCelebration(true)}
            className="px-12 py-6 text-lg bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90 shadow-2xl shadow-primary/50"
          >
            🎉 Trigger Celebration Animation
          </Button>

          <p className="text-xs text-zinc-500 mt-6">
            This animation automatically shows on the dashboard when users achieve a 5-number match
          </p>
        </div>
      </Card>
    </div>
  );
}

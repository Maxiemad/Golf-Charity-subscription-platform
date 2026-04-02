import { ImpactChallenge } from '../components/ImpactChallenge';
import { Card } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GameDemo() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-outfit font-bold mb-3">Impact Challenge Demo</h1>
          <p className="text-zinc-400 text-lg">Play the golf putting mini-game and see how users can make a difference!</p>
        </div>

        <Card className="bg-zinc-900 border-white/10 p-6 mb-8">
          <h2 className="text-xl font-outfit font-semibold mb-4 text-primary">Game Features:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
            <div>✅ Interactive golf putting simulator with physics</div>
            <div>✅ Angle adjustment slider (20°-70°)</div>
            <div>✅ Power charging mechanism (hold to charge)</div>
            <div>✅ Each successful putt = 50-100 points</div>
            <div>✅ $0.50 per point donated to selected charity</div>
            <div>✅ 5 plays per day to encourage daily engagement</div>
            <div>✅ Real-time impact tracking</div>
            <div>✅ Smooth ball physics with friction simulation</div>
          </div>
        </Card>

        <ImpactChallenge selectedCharityName="Children's Education Fund (Demo)" />
        
        <div className="mt-8 p-6 bg-zinc-900 border border-white/10 rounded-xl">
          <h3 className="font-semibold mb-3">Location in App:</h3>
          <p className="text-zinc-400">This game appears at the <strong className="text-primary">bottom of the Dashboard page</strong> for users with active subscriptions. Scroll down after the "Monthly Draw History" section to find it!</p>
        </div>
      </div>
    </div>
  );
}

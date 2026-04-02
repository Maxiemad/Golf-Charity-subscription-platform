import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Heart, TrendingUp, Users, DollarSign, ArrowRight, Check } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/29708293/pexels-photo-29708293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-background"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-outfit font-bold tracking-tighter mb-6 animate-fade-in-up"
            data-testid="hero-title"
          >
            Play. Win.
            <span className="text-primary block mt-2">Change Lives.</span>
          </h1>

          <p
            className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            data-testid="hero-subtitle"
          >
            Join a community where your passion for performance supports causes that matter. Enter
            scores, win prizes, and make a real impact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="text-lg px-8 py-6 group"
                data-testid="cta-get-started"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/charities">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-white/20 hover:bg-white/10"
                data-testid="cta-view-charities"
              >
                View Charities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-zinc-900/60 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="stat-prize-pool">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-4xl font-outfit font-bold mb-2">$50,000+</div>
              <div className="text-zinc-400">Monthly Prize Pool</div>
            </div>
            <div className="text-center" data-testid="stat-members">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-4xl font-outfit font-bold mb-2">2,500+</div>
              <div className="text-zinc-400">Active Members</div>
            </div>
            <div className="text-center" data-testid="stat-charity">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-4xl font-outfit font-bold mb-2">$100,000+</div>
              <div className="text-zinc-400">Donated to Charities</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-lg text-zinc-400">Three simple steps to play and give back</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-zinc-900 border-white/5 p-8 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-outfit font-semibold mb-3">Subscribe & Choose</h3>
              <p className="text-zinc-400 leading-relaxed">
                Join with a monthly or yearly plan. Select a charity you care about—10% minimum of
                your subscription goes to them.
              </p>
            </Card>

            <Card className="bg-zinc-900 border-white/5 p-8 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-outfit font-semibold mb-3">Enter Your Scores</h3>
              <p className="text-zinc-400 leading-relaxed">
                Track your last 5 Stableford scores (1-45). These numbers are your entry to the
                monthly draw.
              </p>
            </Card>

            <Card className="bg-zinc-900 border-white/5 p-8 hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-outfit font-semibold mb-3">Win & Make Impact</h3>
              <p className="text-zinc-400 leading-relaxed">
                Match 3, 4, or 5 numbers in the monthly draw to win prizes. Every subscription
                supports your chosen charity.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Charity Impact Section */}
      <section className="py-32 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold tracking-tight mb-6">
                Support Causes
                <span className="text-primary block mt-2">That Matter</span>
              </h2>
              <p className="text-lg text-zinc-300 leading-relaxed mb-8">
                Every subscription contributes to real change. Choose from vetted charities focused
                on education, health, environment, and community development.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300">Minimum 10% of every subscription goes directly to charity</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300">Increase your contribution percentage anytime</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300">Full transparency on all charitable donations</span>
                </li>
              </ul>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwaW1wYWN0JTIwc21pbGluZyUyMGNvbW11bml0eXxlbnwwfHx8fDE3NzUxMTI2NzJ8MA&ixlib=rb-4.1.0&q=85"
                alt="Charity Impact"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold tracking-tight mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-zinc-400">Choose the plan that works for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-zinc-900 border-white/5 p-10">
              <div className="text-sm uppercase tracking-widest text-zinc-400 mb-2">Monthly</div>
              <div className="text-5xl font-outfit font-bold mb-6">
                $20
                <span className="text-xl text-zinc-400 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Enter monthly draws</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Track 5 scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Support your charity</span>
                </li>
              </ul>
              <Link to="/register">
                <Button className="w-full" data-testid="pricing-monthly-cta">
                  Get Started
                </Button>
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-10 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-xs font-semibold">
                BEST VALUE
              </div>
              <div className="text-sm uppercase tracking-widest text-zinc-400 mb-2">Yearly</div>
              <div className="text-5xl font-outfit font-bold mb-6">
                $200
                <span className="text-xl text-zinc-400 font-normal">/year</span>
              </div>
              <div className="text-sm text-primary mb-6">Save $40 - 2 months free!</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>All monthly features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Better value</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Uninterrupted access</span>
                </li>
              </ul>
              <Link to="/register">
                <Button className="w-full" data-testid="pricing-yearly-cta">
                  Get Started
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-transparent to-zinc-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold tracking-tight mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-zinc-300 mb-10">
            Join hundreds of members combining their passion with purpose.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-10 py-6" data-testid="final-cta">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Heart, Check, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function CharitiesPage() {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/charities`);
      setCharities(data);
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharity = async (charityId) => {
    if (!user) {
      toast.error('Please login to select a charity');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/user/select-charity`,
        { charity_id: charityId },
        { withCredentials: true }
      );
      toast.success('✅ Charity selected successfully!');
      await refreshUser();
    } catch (error) {
      console.error('Charity selection error:', error);
      toast.error(error.response?.data?.detail || 'Failed to select charity');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Make a Real Difference</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-outfit font-bold mb-6" data-testid="charities-title">
            Support a Cause
            <span className="block mt-3 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              That Matters to You
            </span>
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Choose a charity to support. At least 10% of your subscription goes directly to your
            selected cause.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities.map((charity) => (
            <div
              key={charity.id}
              className="group relative"
              data-testid="charity-card"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative bg-card border-white/10 overflow-hidden transform transition-all duration-300 hover:scale-105 shadow-2xl">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={charity.image_url}
                    alt={charity.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
                  {charity.featured && (
                    <Badge
                      className="absolute top-4 right-4 bg-primary shadow-xl"
                      data-testid="featured-badge"
                    >
                      ⭐ Featured
                    </Badge>
                  )}
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-outfit font-bold mb-4" data-testid="charity-name">
                    {charity.name}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{charity.description}</p>

                  {charity.upcoming_events && charity.upcoming_events.length > 0 && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        <Calendar className="w-3 h-3" />
                        Upcoming Events
                      </div>
                      <div className="space-y-2">
                        {charity.upcoming_events.slice(0, 2).map((event, idx) => (
                          <div key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            {event}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full py-6 hover:scale-105 transition-transform shadow-lg"
                    onClick={() => handleSelectCharity(charity.charity_id)}
                    disabled={!user || user.selected_charity_id === charity.charity_id}
                    data-testid="select-charity-button"
                  >
                    {!user ? (
                      'Login to Support This Cause'
                    ) : user.selected_charity_id === charity.charity_id ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Currently Supporting
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Support This Cause
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

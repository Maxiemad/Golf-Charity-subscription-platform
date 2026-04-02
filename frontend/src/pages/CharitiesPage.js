import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Heart, Check } from 'lucide-react';
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
      toast.success('Charity selected successfully!');
      await refreshUser();
    } catch (error) {
      toast.error('Failed to select charity');
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
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-outfit font-bold mb-4" data-testid="charities-title">
            Support a Cause
            <span className="text-primary block mt-2">That Matters to You</span>
          </h1>
          <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
            Choose a charity to support. At least 10% of your subscription goes directly to your
            selected cause.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {charities.map((charity) => (
            <Card
              key={charity.id}
              className="bg-zinc-900 border-white/5 overflow-hidden group hover:scale-105 transition-transform"
              data-testid="charity-card"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={charity.image_url}
                  alt={charity.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {charity.featured && (
                  <Badge
                    className="absolute top-4 right-4 bg-primary"
                    data-testid="featured-badge"
                  >
                    Featured
                  </Badge>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-outfit font-bold mb-3" data-testid="charity-name">
                  {charity.name}
                </h3>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{charity.description}</p>

                {charity.upcoming_events && charity.upcoming_events.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-zinc-500 mb-2">Upcoming Events:</div>
                    <div className="space-y-1">
                      {charity.upcoming_events.slice(0, 2).map((event, idx) => (
                        <div key={idx} className="text-xs text-zinc-400">
                          • {event}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleSelectCharity(charity.id)}
                  disabled={!user || user.selected_charity_id === charity.id}
                  data-testid="select-charity-button"
                >
                  {!user ? (
                    'Login to Select'
                  ) : user.selected_charity_id === charity.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Support This Cause
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

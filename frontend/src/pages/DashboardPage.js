import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  CreditCard,
  Calendar,
  Heart,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [addingScore, setAddingScore] = useState(false);
  const [newScore, setNewScore] = useState({ score_value: '', score_date: '' });
  const [participations, setParticipations] = useState([]);
  const [loadingParticipations, setLoadingParticipations] = useState(true);

  useEffect(() => {
    fetchScores();
    fetchParticipations();

    // Check for successful payment
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [location]);

  const checkPaymentStatus = async (sessionId) => {
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast.error('Payment verification timed out. Please refresh the page.');
        return;
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/api/subscription/checkout-status/${sessionId}`,
          { withCredentials: true }
        );

        if (data.payment_status === 'paid') {
          toast.success('Subscription activated successfully!');
          await refreshUser();
          // Remove session_id from URL
          window.history.replaceState({}, '', '/dashboard');
          return;
        }

        attempts++;
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Payment status check error:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const fetchScores = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/scores`, { withCredentials: true });
      setScores(data);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoadingScores(false);
    }
  };

  const fetchParticipations = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/user/participations`, {
        withCredentials: true,
      });
      setParticipations(data);
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setLoadingParticipations(false);
    }
  };

  const handleAddScore = async (e) => {
    e.preventDefault();
    setAddingScore(true);

    try {
      await axios.post(
        `${API_URL}/api/scores`,
        {
          score_value: parseInt(newScore.score_value),
          score_date: newScore.score_date,
        },
        { withCredentials: true }
      );

      toast.success('Score added successfully!');
      setNewScore({ score_value: '', score_date: '' });
      fetchScores();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add score');
    } finally {
      setAddingScore(false);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    try {
      await axios.delete(`${API_URL}/api/scores/${scoreId}`, { withCredentials: true });
      toast.success('Score deleted successfully!');
      fetchScores();
    } catch (error) {
      toast.error('Failed to delete score');
    }
  };

  const handleSubscribe = async (tier) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/subscription/create-checkout`,
        {
          tier,
          origin_url: window.location.origin,
        },
        { withCredentials: true }
      );

      window.location.href = data.url;
    } catch (error) {
      toast.error('Failed to create checkout session');
    }
  };

  const totalWinnings = participations
    .filter((p) => p.won)
    .reduce((sum, p) => sum + (p.prize_amount || 0), 0);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-outfit font-bold mb-2" data-testid="dashboard-title">
            Welcome back, {user?.name}
          </h1>
          <p className="text-zinc-400">Manage your scores, subscription, and track your winnings</p>
        </div>

        {/* Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-white/5 p-6" data-testid="subscription-card">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-outfit font-semibold">Subscription</h3>
            </div>
            {user?.subscription_status === 'active' ? (
              <div>
                <Badge className="mb-2" data-testid="subscription-status-active">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                <p className="text-sm text-zinc-400">
                  {user.subscription_tier === 'monthly' ? 'Monthly' : 'Yearly'} Plan
                </p>
                {user.subscription_end_date && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Renews: {new Date(user.subscription_end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Badge variant="destructive" className="mb-3" data-testid="subscription-status-inactive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inactive
                </Badge>
                <p className="text-sm text-zinc-400 mb-4">
                  Subscribe to enter draws and track scores
                </p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleSubscribe('monthly')}
                    data-testid="subscribe-monthly-button"
                  >
                    Monthly - $20
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubscribe('yearly')}
                    data-testid="subscribe-yearly-button"
                  >
                    Yearly - $200
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-zinc-900 border-white/5 p-6" data-testid="charity-card">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="font-outfit font-semibold">Your Charity</h3>
            </div>
            {user?.selected_charity_id ? (
              <div>
                <p className="text-sm text-zinc-400 mb-2">Contributing {user.charity_contribution_percentage}%</p>
                <Link to="/charities">
                  <Button variant="outline" size="sm" data-testid="change-charity-button">
                    Change Charity
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-400 mb-4">No charity selected yet</p>
                <Link to="/charities">
                  <Button size="sm" data-testid="select-charity-button">
                    Select Charity
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="bg-zinc-900 border-white/5 p-6" data-testid="winnings-card">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-outfit font-semibold">Total Winnings</h3>
            </div>
            <div className="text-3xl font-outfit font-bold text-primary">
              ${totalWinnings.toFixed(2)}
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              {participations.filter((p) => p.won).length} winning entries
            </p>
          </Card>
        </div>

        {/* Scores Section */}
        <Card className="bg-zinc-900 border-white/5 p-8 mb-8" data-testid="scores-section">
          <h2 className="text-2xl font-outfit font-bold mb-6">Your Scores</h2>

          {user?.subscription_status === 'active' ? (
            <>
              <form onSubmit={handleAddScore} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div>
                  <Label htmlFor="score_value">Score (1-45)</Label>
                  <Input
                    id="score_value"
                    type="number"
                    min="1"
                    max="45"
                    value={newScore.score_value}
                    onChange={(e) => setNewScore({ ...newScore, score_value: e.target.value })}
                    placeholder="35"
                    required
                    data-testid="score-value-input"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="score_date">Date</Label>
                  <Input
                    id="score_date"
                    type="date"
                    value={newScore.score_date}
                    onChange={(e) => setNewScore({ ...newScore, score_date: e.target.value })}
                    required
                    data-testid="score-date-input"
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={addingScore}
                    className="w-full"
                    data-testid="add-score-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {addingScore ? 'Adding...' : 'Add Score'}
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                {loadingScores ? (
                  <div className="text-center text-zinc-400 py-8">Loading scores...</div>
                ) : scores.length === 0 ? (
                  <div className="text-center text-zinc-400 py-8" data-testid="no-scores-message">
                    No scores yet. Add your first score above!
                  </div>
                ) : (
                  scores.map((score) => (
                    <div
                      key={score.score_id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5"
                      data-testid="score-item"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-outfit font-bold text-primary">
                          {score.score_value}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(score.score_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteScore(score.score_id)}
                        data-testid="delete-score-button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-zinc-400" data-testid="subscription-required-message">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="mb-4">Active subscription required to manage scores</p>
              <Button onClick={() => handleSubscribe('monthly')} data-testid="subscribe-to-add-scores">
                Subscribe Now
              </Button>
            </div>
          )}
        </Card>

        {/* Participations Section */}
        <Card className="bg-zinc-900 border-white/5 p-8" data-testid="participations-section">
          <h2 className="text-2xl font-outfit font-bold mb-6">Recent Draws</h2>

          {loadingParticipations ? (
            <div className="text-center text-zinc-400 py-8">Loading participations...</div>
          ) : participations.length === 0 ? (
            <div className="text-center text-zinc-400 py-8" data-testid="no-participations-message">
              No draw participations yet. Add 5 scores to enter the next draw!
            </div>
          ) : (
            <div className="space-y-4">
              {participations.slice(0, 5).map((p) => (
                <div
                  key={p.participation_id}
                  className="p-5 bg-zinc-800/50 rounded-lg border border-white/5"
                  data-testid="participation-item"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-zinc-400">
                      {p.draw_date && new Date(p.draw_date).toLocaleDateString()}
                    </div>
                    {p.won && (
                      <Badge className="bg-primary/20 text-primary" data-testid="winning-badge">
                        Winner!
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500 mb-2">Your Numbers</div>
                      <div className="flex gap-2">
                        {p.user_numbers?.map((num, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-semibold"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 mb-2">Draw Numbers</div>
                      <div className="flex gap-2">
                        {p.draw_numbers?.map((num, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                              p.user_numbers?.includes(num)
                                ? 'bg-primary text-white'
                                : 'bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {p.won && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-400">Prize Amount:</div>
                        <div className="text-lg font-outfit font-bold text-primary">
                          ${(p.prize_amount || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-zinc-400">Payment Status:</div>
                        <Badge
                          variant={p.payment_status === 'paid' ? 'default' : 'outline'}
                          data-testid="payment-status-badge"
                        >
                          {p.payment_status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

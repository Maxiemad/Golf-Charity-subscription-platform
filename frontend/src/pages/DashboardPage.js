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
  Trophy,
  Target,
  Sparkles,
  Clock,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [scores, setScores] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [addingScore, setAddingScore] = useState(false);
  const [newScore, setNewScore] = useState({ score_value: '', score_date: new Date().toISOString().split('T')[0] });
  const [participations, setParticipations] = useState([]);
  const [loadingParticipations, setLoadingParticipations] = useState(true);
  const [charities, setCharities] = useState([]);
  const [selectedCharityName, setSelectedCharityName] = useState('');

  useEffect(() => {
    fetchScores();
    fetchParticipations();
    fetchCharities();

    // Check for successful payment
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [location]);

  useEffect(() => {
    if (user?.selected_charity_id && charities.length > 0) {
      const charity = charities.find(c => c.id === user.selected_charity_id);
      setSelectedCharityName(charity?.name || 'Unknown Charity');
    }
  }, [user, charities]);

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
          toast.success('🎉 Subscription activated! Welcome to the community!');
          await refreshUser();
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

  const fetchCharities = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/charities`);
      setCharities(data);
    } catch (error) {
      console.error('Error fetching charities:', error);
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

      toast.success('✅ Score added successfully!');
      setNewScore({ score_value: '', score_date: new Date().toISOString().split('T')[0] });
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

  const winningCount = participations.filter((p) => p.won).length;

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Your Impact Dashboard</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-outfit font-bold mb-3" data-testid="dashboard-title">
            Welcome back, <span className="text-primary">{user?.name}</span>
          </h1>
          <p className="text-xl text-zinc-400">Track your scores, manage subscriptions, and see your impact</p>
        </div>

        {/* Status Cards - 3D Effect */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Subscription Card */}
          <div className="group perspective-1000">
            <Card 
              className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 p-8 transform transition-all duration-500 hover:scale-105 hover:-rotate-1 shadow-2xl hover:shadow-primary/30"
              data-testid="subscription-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard className="w-7 h-7 text-primary" />
                  </div>
                  {user?.subscription_status === 'active' ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="subscription-status-active">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="subscription-status-inactive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-outfit font-semibold mb-2">Subscription</h3>
                
                {user?.subscription_status === 'active' ? (
                  <div>
                    <p className="text-2xl font-bold text-primary mb-2">
                      {user.subscription_tier === 'monthly' ? 'Monthly' : 'Yearly'} Plan
                    </p>
                    {user.subscription_end_date && (
                      <p className="text-sm text-zinc-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Renews: {new Date(user.subscription_end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-zinc-400 mb-4">Start your subscription to unlock all features</p>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        className="w-full hover:scale-105 transition-transform"
                        onClick={() => handleSubscribe('monthly')}
                        data-testid="subscribe-monthly-button"
                      >
                        Activate Monthly - $20
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-primary/30 hover:scale-105 transition-transform"
                        onClick={() => handleSubscribe('yearly')}
                        data-testid="subscribe-yearly-button"
                      >
                        Activate Yearly - $200
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Charity Card */}
          <div className="group perspective-1000">
            <Card 
              className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 p-8 transform transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-pink-600/30"
              data-testid="charity-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-pink-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-7 h-7 text-pink-500" />
                  </div>
                </div>
                
                <h3 className="text-lg font-outfit font-semibold mb-2">Your Charity</h3>
                
                {user?.selected_charity_id ? (
                  <div>
                    <p className="text-zinc-300 mb-2 font-semibold">{selectedCharityName}</p>
                    <p className="text-sm text-zinc-400 mb-4">
                      Contributing <span className="text-primary font-bold">{user.charity_contribution_percentage}%</span> of subscription
                    </p>
                    <Link to="/charities">
                      <Button variant="outline" size="sm" className="w-full hover:scale-105 transition-transform" data-testid="change-charity-button">
                        Change My Charity
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-zinc-400 mb-4">Choose a cause to support</p>
                    <Link to="/charities">
                      <Button size="sm" className="w-full hover:scale-105 transition-transform" data-testid="select-charity-button">
                        <Heart className="w-4 h-4 mr-2" />
                        Select Your Charity
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Winnings Card */}
          <div className="group perspective-1000">
            <Card 
              className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 p-8 transform transition-all duration-500 hover:scale-105 hover:rotate-1 shadow-2xl hover:shadow-yellow-600/30"
              data-testid="winnings-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-yellow-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                  </div>
                  {winningCount > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {winningCount} {winningCount === 1 ? 'Win' : 'Wins'}
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-outfit font-semibold mb-2">Total Winnings</h3>
                
                <div className="text-4xl font-outfit font-bold text-yellow-500 mb-1">
                  ${totalWinnings.toFixed(2)}
                </div>
                <p className="text-sm text-zinc-400">
                  {participations.length} total {participations.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Scores Section - Enhanced 3D */}
        <Card 
          className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 p-10 mb-12 relative overflow-hidden shadow-2xl"
          data-testid="scores-section"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-outfit font-bold">Your Stableford Scores</h2>
                <p className="text-zinc-400">Track your last 5 scores (1-45 points)</p>
              </div>
            </div>

            {user?.subscription_status === 'active' ? (
              <>
                {/* Add Score Form */}
                <form onSubmit={handleAddScore} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                  <div>
                    <Label htmlFor="score_value" className="text-zinc-300 mb-2">Score (1-45)</Label>
                    <Input
                      id="score_value"
                      type="number"
                      min="1"
                      max="45"
                      value={newScore.score_value}
                      onChange={(e) => setNewScore({ ...newScore, score_value: e.target.value })}
                      placeholder="e.g., 35"
                      required
                      data-testid="score-value-input"
                      className="mt-2 bg-zinc-800 border-zinc-700 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="score_date" className="text-zinc-300 mb-2">Date Played</Label>
                    <Input
                      id="score_date"
                      type="date"
                      value={newScore.score_date}
                      onChange={(e) => setNewScore({ ...newScore, score_date: e.target.value })}
                      required
                      data-testid="score-date-input"
                      className="mt-2 bg-zinc-800 border-zinc-700 focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <Button
                      type="submit"
                      disabled={addingScore}
                      className="w-full h-12 hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                      data-testid="add-score-button"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      {addingScore ? 'Adding Score...' : 'Add Score to Draw Entry'}
                    </Button>
                  </div>
                </form>

                {/* Scores List */}
                <div className="space-y-4">
                  {loadingScores ? (
                    <div className="text-center text-zinc-400 py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4">Loading your scores...</p>
                    </div>
                  ) : scores.length === 0 ? (
                    <div className="text-center py-16" data-testid="no-scores-message">
                      <Target className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                      <p className="text-xl text-zinc-400 mb-2">No scores yet!</p>
                      <p className="text-zinc-500">Add your first Stableford score to enter the next draw</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-zinc-400">{scores.length} of 5 scores tracked</p>
                        {scores.length === 5 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Eligible for Draw
                          </Badge>
                        )}
                      </div>
                      {scores.map((score, index) => (
                        <div
                          key={score.score_id}
                          className="group relative p-6 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-primary/30 transition-all hover:scale-102 shadow-lg"
                          data-testid="score-item"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="relative">
                                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg"></div>
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-xl">
                                  <span className="text-3xl font-outfit font-bold">{score.score_value}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <Calendar className="w-4 h-4 text-zinc-400" />
                                  <span className="text-lg font-semibold">{new Date(score.score_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <p className="text-sm text-zinc-500">Score #{scores.length - index}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteScore(score.score_id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                              data-testid="delete-score-button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20" data-testid="subscription-required-message">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-outfit font-bold mb-3">Subscription Required</h3>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">Activate your subscription to start tracking scores and entering monthly draws</p>
                <Button onClick={() => handleSubscribe('monthly')} size="lg" className="hover:scale-105 transition-transform" data-testid="subscribe-to-add-scores">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Activate Subscription
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Participations Section - Enhanced */}
        <Card 
          className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 p-10 relative overflow-hidden shadow-2xl"
          data-testid="participations-section"
        >
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-outfit font-bold">Monthly Draw History</h2>
                <p className="text-zinc-400">Your participation and winnings</p>
              </div>
            </div>

            {loadingParticipations ? (
              <div className="text-center text-zinc-400 py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Loading draw history...</p>
              </div>
            ) : participations.length === 0 ? (
              <div className="text-center py-16" data-testid="no-participations-message">
                <Trophy className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-xl text-zinc-400 mb-2">No draw entries yet</p>
                <p className="text-zinc-500">Add 5 scores to automatically enter the next monthly draw!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {participations.slice(0, 10).map((p) => (
                  <div
                    key={p.participation_id}
                    className={`relative p-8 rounded-2xl border transition-all hover:scale-102 ${
                      p.won
                        ? 'bg-gradient-to-br from-primary/10 to-pink-600/10 border-primary/30 shadow-lg shadow-primary/20'
                        : 'bg-zinc-800/50 border-white/5'
                    }`}
                    data-testid="participation-item"
                  >
                    {p.won && (
                      <div className="absolute top-0 right-0 -mt-3 -mr-3">
                        <Badge className="bg-gradient-to-r from-primary to-pink-600 text-white shadow-lg" data-testid="winning-badge">
                          <Trophy className="w-3 h-3 mr-1" />
                          WINNER!
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                        <span className="text-lg font-semibold">
                          {p.draw_date && new Date(p.draw_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <Badge variant={p.won ? 'default' : 'outline'}>
                        {p.matched_count} {p.matched_count === 1 ? 'Match' : 'Matches'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Your Numbers</p>
                        <div className="flex gap-2 flex-wrap">
                          {p.user_numbers?.map((num, i) => (
                            <div
                              key={i}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${
                                p.draw_numbers?.includes(num)
                                  ? 'bg-gradient-to-br from-primary to-pink-600 text-white'
                                  : 'bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Winning Numbers</p>
                        <div className="flex gap-2 flex-wrap">
                          {p.draw_numbers?.map((num, i) => (
                            <div
                              key={i}
                              className="w-12 h-12 rounded-xl bg-zinc-700 flex items-center justify-center font-bold text-lg shadow-lg"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {p.won && (
                      <div className="pt-6 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-zinc-400 mb-1">Prize Amount</p>
                            <p className="text-2xl font-outfit font-bold text-primary flex items-center gap-2">
                              <DollarSign className="w-5 h-5" />
                              {(p.prize_amount || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-zinc-400 mb-1">Payment Status</p>
                            <Badge
                              variant={p.payment_status === 'paid' ? 'default' : 'outline'}
                              className={p.payment_status === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                              data-testid="payment-status-badge"
                            >
                              {p.payment_status === 'paid' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

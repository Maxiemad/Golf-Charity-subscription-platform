import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Users, DollarSign, Heart, TrendingUp, Play, Award } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [publishingDraw, setPublishingDraw] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchWinners();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
        withCredentials: true,
      });
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true,
      });
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/winners`, {
        withCredentials: true,
      });
      setWinners(data);
    } catch (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const handleSimulateDraw = async () => {
    setLoadingSimulation(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/draws/simulate`,
        {},
        { withCredentials: true }
      );
      setSimulationResult(data);
      toast.success('Draw simulation complete!');
    } catch (error) {
      toast.error('Failed to simulate draw');
    } finally {
      setLoadingSimulation(false);
    }
  };

  const handlePublishDraw = async () => {
    if (!simulationResult) {
      toast.error('Please simulate a draw first');
      return;
    }

    setPublishingDraw(true);
    try {
      await axios.post(
        `${API_URL}/api/draws/publish`,
        simulationResult,
        { withCredentials: true }
      );
      toast.success('Draw published successfully!');
      setSimulationResult(null);
      fetchStats();
      fetchWinners();
    } catch (error) {
      toast.error('Failed to publish draw');
    } finally {
      setPublishingDraw(false);
    }
  };

  const handleMarkPaid = async (participationId) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/winners/${participationId}/mark-paid`,
        {},
        { withCredentials: true }
      );
      toast.success('Winner marked as paid');
      fetchWinners();
    } catch (error) {
      toast.error('Failed to mark as paid');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-outfit font-bold mb-8" data-testid="admin-title">
          Admin Dashboard
        </h1>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-zinc-900 border-white/5 p-6" data-testid="stat-total-users">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-sm text-zinc-400">Total Users</h3>
              </div>
              <div className="text-3xl font-outfit font-bold">{stats.total_users}</div>
            </Card>

            <Card className="bg-zinc-900 border-white/5 p-6" data-testid="stat-active-subscribers">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-sm text-zinc-400">Active Subscribers</h3>
              </div>
              <div className="text-3xl font-outfit font-bold">{stats.active_subscribers}</div>
            </Card>

            <Card className="bg-zinc-900 border-white/5 p-6" data-testid="stat-prize-pool">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="text-sm text-zinc-400">Prize Pool</h3>
              </div>
              <div className="text-3xl font-outfit font-bold">
                ${stats.total_prize_pool.toFixed(0)}
              </div>
            </Card>

            <Card className="bg-zinc-900 border-white/5 p-6" data-testid="stat-charity-contributions">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-primary" />
                <h3 className="text-sm text-zinc-400">Charity Contributions</h3>
              </div>
              <div className="text-3xl font-outfit font-bold">
                ${stats.total_charity_contributions.toFixed(0)}
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="draws" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="draws" data-testid="tab-draws">
              Draw Management
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              Users
            </TabsTrigger>
            <TabsTrigger value="winners" data-testid="tab-winners">
              Winners
            </TabsTrigger>
          </TabsList>

          {/* Draw Management Tab */}
          <TabsContent value="draws">
            <Card className="bg-zinc-900 border-white/5 p-8">
              <h2 className="text-2xl font-outfit font-bold mb-6">Monthly Draw Management</h2>

              <div className="mb-8">
                <Button
                  onClick={handleSimulateDraw}
                  disabled={loadingSimulation}
                  className="mr-4"
                  data-testid="simulate-draw-button"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loadingSimulation ? 'Simulating...' : 'Simulate Draw'}
                </Button>

                {simulationResult && (
                  <Button
                    onClick={handlePublishDraw}
                    disabled={publishingDraw}
                    variant="default"
                    data-testid="publish-draw-button"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {publishingDraw ? 'Publishing...' : 'Publish Draw'}
                  </Button>
                )}
              </div>

              {simulationResult && (
                <div className="space-y-6" data-testid="simulation-results">
                  <div>
                    <h3 className="text-lg font-outfit font-semibold mb-4">Draw Numbers</h3>
                    <div className="flex gap-3">
                      {simulationResult.draw_numbers.map((num, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-zinc-800 border-white/5 p-6">
                      <h4 className="text-sm text-zinc-400 mb-2">5-Match Prize Pool</h4>
                      <div className="text-2xl font-outfit font-bold text-primary">
                        ${simulationResult.prize_pool_5_match.toFixed(2)}
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">
                        {simulationResult.estimated_winners_5} winners
                      </div>
                    </Card>

                    <Card className="bg-zinc-800 border-white/5 p-6">
                      <h4 className="text-sm text-zinc-400 mb-2">4-Match Prize Pool</h4>
                      <div className="text-2xl font-outfit font-bold text-primary">
                        ${simulationResult.prize_pool_4_match.toFixed(2)}
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">
                        {simulationResult.estimated_winners_4} winners
                      </div>
                    </Card>

                    <Card className="bg-zinc-800 border-white/5 p-6">
                      <h4 className="text-sm text-zinc-400 mb-2">3-Match Prize Pool</h4>
                      <div className="text-2xl font-outfit font-bold text-primary">
                        ${simulationResult.prize_pool_3_match.toFixed(2)}
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">
                        {simulationResult.estimated_winners_3} winners
                      </div>
                    </Card>
                  </div>

                  <div className="text-sm text-zinc-400">
                    Total Prize Pool: ${simulationResult.prize_pool_total.toFixed(2)} | Active
                    Subscribers: {simulationResult.active_subscribers}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-zinc-900 border-white/5 p-8">
              <h2 className="text-2xl font-outfit font-bold mb-6">Users ({users.length})</h2>

              <div className="space-y-3">
                {users.slice(0, 20).map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5"
                    data-testid="user-item"
                  >
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-zinc-400">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={user.subscription_status === 'active' ? 'default' : 'outline'}
                        data-testid="user-subscription-status"
                      >
                        {user.subscription_status}
                      </Badge>
                      <Badge variant="outline" data-testid="user-role">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Winners Tab */}
          <TabsContent value="winners">
            <Card className="bg-zinc-900 border-white/5 p-8">
              <h2 className="text-2xl font-outfit font-bold mb-6">Winners ({winners.length})</h2>

              <div className="space-y-4">
                {winners.slice(0, 20).map((winner) => (
                  <div
                    key={winner.participation_id}
                    className="p-5 bg-zinc-800/50 rounded-lg border border-white/5"
                    data-testid="winner-item"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">{winner.user_name}</div>
                        <div className="text-sm text-zinc-400">{winner.user_email}</div>
                      </div>
                      <Badge className="bg-primary/20 text-primary">
                        {winner.matched_count}-Match Winner
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">User Numbers</div>
                        <div className="flex gap-1">
                          {winner.user_numbers?.map((num, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Payment Status</div>
                        <Badge
                          variant={winner.payment_status === 'paid' ? 'default' : 'outline'}
                          data-testid="winner-payment-status"
                        >
                          {winner.payment_status || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    {winner.payment_status !== 'paid' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(winner.participation_id)}
                        data-testid="mark-paid-button"
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

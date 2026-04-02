import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { ArrowUp } from 'lucide-react';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, name);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-zinc-900 border-white/5 p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink-600 rounded-lg blur opacity-75"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-lg flex items-center justify-center shadow-xl">
              <ArrowUp className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-3xl font-outfit font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Uplift</span>
        </div>

        <h1 className="text-2xl font-outfit font-bold text-center mb-2" data-testid="register-title">
          Create Account
        </h1>
        <p className="text-center text-zinc-400 mb-8">Join the community today</p>

        {error && (
          <div
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6"
            data-testid="register-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              data-testid="register-name-input"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              data-testid="register-email-input"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              data-testid="register-password-input"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="register-submit-button"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline" data-testid="login-link">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Mail, Lock, UserPlus } from 'lucide-react';

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
      <Card className="w-full max-w-md bg-card border-border p-8">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-pink-500 to-primary rounded-full blur opacity-75"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-pink-600 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="12" r="6" opacity="0.6" />
                <circle cx="12" cy="12" r="10" opacity="0.3" />
              </svg>
            </div>
          </div>
          <span className="text-3xl font-outfit font-bold text-foreground">Ripple</span>
        </div>

        <h1 className="text-2xl font-outfit font-bold text-center mb-2" data-testid="register-title">
          Create Account
        </h1>
        <p className="text-center text-muted-foreground mb-8">Join the community today</p>

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

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline" data-testid="login-link">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

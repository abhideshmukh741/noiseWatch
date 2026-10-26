/**
 * Register Page
 * 
 * User registration with role selection (Resident or Organization Operator).
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Headline */}
        <div className="text-center">
          <Link to="/" className="inline-block text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Noise<span className="text-[var(--color-accent)]">Watch</span>
          </Link>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-3">
            Create an Account
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Join NoiseWatch to participate in environmental noise monitoring
          </p>
        </div>

        {error && (
          <div className="glass-card p-3 text-xs text-[var(--color-danger)] border-l-4 border-l-[var(--color-danger)] bg-red-50/70 font-semibold">
            {error}
          </div>
        )}

        <div className="glass-card p-6 space-y-4">
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase block mb-1">
                Full Name or Organization
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Dr. Jane Doe / Green Neighborhood Assoc."
                className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@organization.org"
                className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-xs justify-center py-2.5 font-bold mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-[var(--color-text-secondary)]">
          Already registered?{' '}
          <Link to="/login" className="text-[var(--color-accent)] hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

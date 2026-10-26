/**
 * Login Page
 * 
 * Secure login with email/password and one-click demo role switchers
 * for Resident, Reviewer, and Administrator.
 * Clean, light environmental design without icons or glassmorphism.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Switcher for Demo
  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    login(demoEmail, demoPass).then(() => navigate('/dashboard')).catch(() => {
      setError('Demo login failed. Make sure backend is running.');
    });
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
            Sign In to NoiseWatch
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Access your acoustic monitoring station and incident reports
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl text-xs text-[#b45309] border border-[#fde68a] bg-[#fef3c7] font-semibold text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="glass-card p-8 rounded-3xl space-y-5 shadow-lg border border-[#e2e8f0]">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase block mb-1.5 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@organization.org"
                className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3 text-xs text-[#0f172a] focus:outline-none focus:border-[#059669] focus:bg-white font-medium transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#475569] uppercase block mb-1.5 ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3 text-xs text-[#0f172a] focus:outline-none focus:border-[#059669] focus:bg-white font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-xs justify-center py-3 font-bold rounded-full mt-3 shadow-md"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="pt-5 border-t border-[#e2e8f0]">
            <div className="text-[10px] uppercase font-bold text-[#475569] text-center mb-3 tracking-wider">
              One-Click Demo Account Sign-In
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('demo@noisewatch.app', 'demo1234')}
                className="btn btn-secondary btn-sm py-2 text-xs font-semibold rounded-full"
              >
                Resident
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer@noisewatch.app', 'demo1234')}
                className="btn btn-secondary btn-sm py-2 text-xs font-semibold rounded-full"
              >
                Reviewer
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@noisewatch.app', 'demo1234')}
                className="btn btn-secondary btn-sm py-2 text-xs font-semibold rounded-full"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-[var(--color-text-secondary)]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--color-accent)] hover:underline font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

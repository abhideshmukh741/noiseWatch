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
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Headline */}
        <div className="text-center">
          <Link to="/" className="inline-block text-2xl font-black tracking-tight text-[#1e2430]">
            Noise<span className="text-[#00a88f]">Watch</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#1e2430] mt-3 tracking-tight">
            Sign In to Telemetry Portal
          </h2>
          <p className="text-xs text-[#58647a] mt-1">
            Access authorized acoustic screening stations and regulatory dossiers
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-3xl text-xs text-[#ff5757] border border-[#ffcdd2] bg-[#ffebee] font-bold text-center shadow-xs">
            {error}
          </div>
        )}

        {/* Login Form: Cathedral Arch Portal `shape-arch` */}
        <div className="shape-arch bg-white border border-[#e2e8f0] p-8 sm:p-10 space-y-6 shadow-sm card-hover-interactive">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-[#58647a] uppercase block mb-1.5 ml-1 tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="officer@pollutioncontrol.gov.in"
                className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 text-xs text-[#1e2430] focus:outline-none focus:border-[#00a88f] focus:bg-white font-medium transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#58647a] uppercase block mb-1.5 ml-1 tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-full bg-[#f8fafc] border border-[#e2e8f0] px-5 py-3.5 text-xs text-[#1e2430] focus:outline-none focus:border-[#00a88f] focus:bg-white font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full text-xs font-bold bg-[#00a88f] hover:bg-[#008f7a] text-white shadow-xs transition-colors mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Network'}
            </button>
          </form>

          {/* Demo Quick Logins */}
          <div className="pt-6 border-t border-[#e2e8f0]">
            <div className="text-[10px] uppercase font-bold text-[#58647a] text-center mb-3 tracking-wider">
              One-Click Role Demonstration
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('demo@noisewatch.app', 'demo1234')}
                className="py-2.5 px-3 rounded-full text-xs font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e2430] transition-colors"
              >
                Resident
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer@noisewatch.app', 'demo1234')}
                className="py-2.5 px-3 rounded-full text-xs font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e2430] transition-colors"
              >
                Reviewer
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@noisewatch.app', 'demo1234')}
                className="py-2.5 px-3 rounded-full text-xs font-bold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e2430] transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-[#58647a]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#00a88f] hover:underline font-bold">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

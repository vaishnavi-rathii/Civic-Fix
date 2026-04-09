import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = (p) => {
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#22c55e'];
  const pw = strength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = register(form.name, form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/feed');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-flame-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-flame-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative w-full max-w-md page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-flame-500 rounded-2xl flex items-center justify-center shadow-lg shadow-flame-500/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-display font-extrabold text-lg">CF</span>
            </div>
            <span className="font-display font-extrabold text-2xl text-white">CivicFix</span>
          </Link>
          <p className="text-white/40 font-body text-sm mt-3">Create your citizen account</p>
        </div>

        {/* Role badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-flame-500/10 border border-flame-500/20 rounded-xl">
            <User size={14} className="text-flame-400" />
            <span className="text-sm font-display font-semibold text-flame-400">Citizen Account</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300 font-body">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-1.5">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 transition-all"
                  placeholder="Priya Sharma"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 transition-all"
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= pw ? strengthColor[pw] : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: strengthColor[pw] }}>{strengthLabel[pw]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 transition-all
                    ${form.confirm && form.confirm !== form.password ? 'border-red-500/40' : 'border-white/10'}`}
                  placeholder="••••••••"
                />
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-400" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-flame-500 hover:bg-flame-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-flame-500/25 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : 'Create Citizen Account'}
            </button>

            <p className="text-center text-xs text-white/20 font-body">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 font-body mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-flame-400 font-display font-semibold hover:text-flame-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

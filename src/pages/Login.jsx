import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('citizen');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      if (result.user.role !== role) {
        const correct = result.user.role === 'admin' ? 'Admin' : 'Citizen';
        setError(`This account is a ${correct} account. Please select "${correct}" above and try again.`);
        return;
      }
      navigate(result.user.role === 'admin' ? '/admin' : '/feed');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-flame-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-flame-500/5 rounded-full blur-3xl" />
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
          <p className="text-white/40 font-body text-sm mt-3">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
          {/* Role Toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => { setRole('citizen'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-semibold text-sm transition-all duration-200
                ${role === 'citizen' ? 'bg-flame-500 text-white shadow-lg shadow-flame-500/30' : 'text-white/50 hover:text-white/80'}`}>
              <User size={15} /> Citizen
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-semibold text-sm transition-all duration-200
                ${role === 'admin' ? 'bg-flame-500 text-white shadow-lg shadow-flame-500/30' : 'text-white/50 hover:text-white/80'}`}>
              <Shield size={15} /> Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300 font-body">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 focus:bg-white/8 transition-all"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-flame-500/60 focus:bg-white/8 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-flame-500 hover:bg-flame-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-flame-500/25 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                role === 'admin' ? 'Login as Admin' : 'Login as Citizen'
              )}
            </button>
          </form>

          {role === 'admin' && (
            <p className="mt-4 text-center text-xs text-white/30 font-body flex items-center justify-center gap-1.5">
              <Shield size={11} /> Admin access is restricted to municipal staff
            </p>
          )}

          {role === 'citizen' && (
            <p className="text-center text-sm text-white/40 font-body mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-flame-400 font-display font-semibold hover:text-flame-300 transition-colors">Register</Link>
            </p>
          )}
        </div>

        {/* Demo hint */}
        <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <p className="text-xs text-white/30 font-body text-center mb-2">Demo accounts</p>
          <div className="flex gap-3 text-xs font-body text-white/25">
            <div className="flex-1">
              <span className="text-white/40">Citizen:</span> arjun@example.com / password
            </div>
            <div className="flex-1">
              <span className="text-white/40">Admin:</span> admin@civicfix.in / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-flame-500/20 rounded-full blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-9 h-9 bg-flame-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-display font-extrabold">CF</span>
          </div>
          <span className="font-display font-bold text-xl text-white">CivicFix</span>
        </Link>

        <div className="relative">
          <h2 className="font-display font-extrabold text-4xl text-white mb-4">
            Be the change<br />you want to see.
          </h2>
          <p className="text-white/60 font-body leading-relaxed mb-8">
            Every issue you report brings your community one step closer to being better.
          </p>
          <div className="space-y-3">
            {['Free to use, always', 'Real-time status updates', 'Direct line to authorities', 'Community-powered'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-white/70 font-body text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs font-body">© 2025 CivicFix</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md page-enter">
          <div className="mb-8">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-flame-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-extrabold text-sm">CF</span>
              </div>
              <span className="font-display font-bold text-lg text-navy-900">CivicFix</span>
            </Link>
            <h1 className="font-display font-extrabold text-3xl text-navy-900">Create account</h1>
            <p className="text-gray-500 font-body mt-1">Join the civic movement today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 font-body">{error}</span>
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field pl-10" placeholder="Priya Sharma" />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field pl-10 pr-10" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= pw ? strengthColor[pw] : '#e5e7eb' }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: strengthColor[pw] }}>{strengthLabel[pw]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" required value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  className={`input-field pl-10 ${form.confirm && form.confirm !== form.password ? 'border-red-300' : ''}`}
                  placeholder="••••••••" />
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm font-semibold mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : 'Create Account'}
            </button>

            <p className="text-center text-xs text-gray-400 font-body">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 font-body mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-flame-500 font-display font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

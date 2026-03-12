import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
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
      navigate(result.user.role === 'admin' ? '/admin' : '/feed');
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') setForm({ email: 'admin@civicfix.in', password: 'admin123' });
    else setForm({ email: 'arjun@example.com', password: 'password' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-flame-500/20 rounded-full blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-9 h-9 bg-flame-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-display font-extrabold">CF</span>
          </div>
          <span className="font-display font-bold text-xl text-white">CivicFix</span>
        </Link>

        <div className="relative">
          <h2 className="font-display font-extrabold text-4xl text-white mb-4 leading-tight">
            Your voice shapes<br />your city.
          </h2>
          <p className="text-white/60 font-body leading-relaxed mb-8">
            Join thousands of citizens who are actively making their communities better through civic participation.
          </p>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-white/80 font-body text-sm italic leading-relaxed mb-3">
              "I reported a pothole that had been there for 2 years. It was fixed in 10 days after I submitted via CivicFix!"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-flame-500 rounded-full flex items-center justify-center font-display font-bold text-sm text-white">R</div>
              <div>
                <p className="font-display font-semibold text-white text-sm">Rajesh Kumar</p>
                <p className="text-white/40 text-xs">Delhi resident</p>
              </div>
            </div>
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
            <h1 className="font-display font-extrabold text-3xl text-navy-900">Welcome back</h1>
            <p className="text-gray-500 font-body mt-1">Sign in to your account to continue</p>
          </div>

          {/* Quick fill */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => fillDemo('citizen')}
              className="flex-1 text-xs font-display font-semibold bg-white border-2 border-gray-200 hover:border-flame-500 text-gray-600 hover:text-flame-500 px-3 py-2.5 rounded-xl transition-all">
              🧑 Demo Citizen
            </button>
            <button onClick={() => fillDemo('admin')}
              className="flex-1 text-xs font-display font-semibold bg-white border-2 border-gray-200 hover:border-navy-900 text-gray-600 hover:text-navy-900 px-3 py-2.5 rounded-xl transition-all">
              👑 Demo Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 font-body">{error}</span>
              </div>
            )}

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
                  className="input-field pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm font-semibold mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 font-body mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-flame-500 font-display font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

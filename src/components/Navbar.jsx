import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Menu, X, Plus, LayoutDashboard, MapPin, User, LogOut, ChevronDown, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, logout, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const navLinks = [
    { to: '/feed', label: 'Public Feed', icon: <MapPin size={16} /> },
    { to: '/generate-letter', label: 'Write Letter', icon: <FileText size={16} /> },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] : []),
  ];

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/feed' : '/'} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-flame-500 rounded-lg flex items-center justify-center shadow-md shadow-flame-500/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-display font-extrabold text-sm">CF</span>
            </div>
            <span className="font-display font-bold text-xl text-navy-900">
              Civic<span className="text-flame-500">Fix</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-200
                    ${isActive(link.to)
                      ? 'bg-flame-500/10 text-flame-500'
                      : 'text-gray-600 hover:text-navy-900 hover:bg-gray-100'}`}
                >
                  {link.icon}{link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Report button */}
                <Link to="/report" className="hidden sm:flex items-center gap-2 bg-flame-500 text-white text-sm font-display font-semibold px-4 py-2 rounded-xl hover:bg-flame-600 transition-all shadow-md shadow-flame-500/25 hover:-translate-y-0.5">
                  <Plus size={16} /><span>Report Issue</span>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell size={20} className="text-gray-600" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-flame-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-navy-900 text-white rounded-full flex items-center justify-center text-sm font-display font-bold">
                      {user.avatar}
                    </div>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/5 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-display font-semibold text-sm text-navy-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-flame-500/10 text-flame-500 text-xs font-semibold rounded-full">Admin</span>
                        )}
                      </div>
                      <Link to="/profile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User size={15} /><span>My Profile</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LayoutDashboard size={15} /><span>Admin Dashboard</span>
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={15} /><span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl hover:bg-gray-100">
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/generate-letter" className="hidden sm:flex items-center gap-1.5 text-sm font-display font-semibold text-gray-600 hover:text-navy-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <FileText size={15} />📝 Write Letter
                </Link>
                <Link to="/login" className="text-sm font-display font-semibold text-gray-600 hover:text-navy-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="text-sm font-display font-semibold bg-navy-900 text-white px-4 py-2 rounded-xl hover:bg-navy-950 transition-all shadow-sm hover:-translate-y-0.5">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {user && menuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 animate-fade-in">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-display font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                {link.icon}{link.label}
              </Link>
            ))}
            <Link to="/report" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-display font-semibold text-flame-500 hover:bg-flame-500/5 rounded-xl transition-colors">
              <Plus size={16} />Report an Issue
            </Link>
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
    </nav>
  );
}

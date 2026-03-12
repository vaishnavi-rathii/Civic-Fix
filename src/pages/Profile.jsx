import { Link } from 'react-router-dom';
import { MapPin, Calendar, Award, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IssueCard from '../components/IssueCard';
import { STATUS_CONFIG, CATEGORIES } from '../utils/helpers';

export default function Profile() {
  const { user, issues } = useApp();
  if (!user) return null;

  const myIssues = issues.filter(i => i.reportedBy === user.id);
  const resolved = myIssues.filter(i => i.status === 'resolved').length;
  const inProgress = myIssues.filter(i => i.status === 'in-progress').length;

  const catCounts = CATEGORIES.map(c => ({
    ...c, count: myIssues.filter(i => i.category === c.id).length
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Profile card */}
            <div className="card p-6 text-center">
              <div className="w-20 h-20 bg-navy-900 text-white text-2xl font-display font-extrabold rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-navy-900/10">
                {user.avatar}
              </div>
              <h2 className="font-display font-extrabold text-xl text-navy-900 mb-1">{user.name}</h2>
              <p className="text-sm text-gray-500 font-body">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-flex items-center mt-2 px-3 py-1 bg-flame-500/10 text-flame-500 text-xs font-display font-bold rounded-full">
                  👑 Administrator
                </span>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <Calendar size={12} />
                <span>Member since {new Date(user.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-4">Your Impact</h3>
              <div className="space-y-3">
                {[
                  { label: 'Issues Reported', value: myIssues.length, icon: '📋', color: '#ff6b35' },
                  { label: 'Resolved', value: resolved, icon: '✅', color: '#22c55e' },
                  { label: 'In Progress', value: inProgress, icon: '🔧', color: '#3b82f6' },
                  { label: 'Total Upvotes', value: myIssues.reduce((sum, i) => sum + i.upvotes, 0), icon: '⬆️', color: '#8b5cf6' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span className="text-sm text-gray-600 font-body">{s.label}</span>
                    </div>
                    <span className="font-display font-bold text-base" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-4">Badges</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🏆', label: 'Pioneer', earned: myIssues.length >= 1 },
                  { icon: '⭐', label: 'Active', earned: myIssues.length >= 3 },
                  { icon: '🎯', label: 'Resolved', earned: resolved >= 1 },
                  { icon: '🔥', label: 'On Fire', earned: myIssues.length >= 5 },
                  { icon: '🌟', label: 'Champion', earned: resolved >= 3 },
                  { icon: '👑', label: 'Legend', earned: myIssues.length >= 10 },
                ].map(b => (
                  <div key={b.label} className={`text-center p-3 rounded-xl border-2 transition-all
                    ${b.earned ? 'border-amber-200 bg-amber-50' : 'border-gray-100 opacity-40 grayscale'}`}>
                    <div className="text-2xl mb-1">{b.icon}</div>
                    <div className="text-xs font-display font-semibold text-gray-600">{b.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories breakdown */}
            {catCounts.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-base text-navy-900 mb-4">Top Categories</h3>
                <div className="space-y-2">
                  {catCounts.slice(0, 4).map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span>{c.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-display font-semibold text-gray-600">{c.label}</span>
                          <span className="text-xs font-bold" style={{ color: c.color }}>{c.count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(c.count / myIssues.length) * 100}%`, backgroundColor: c.color }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-extrabold text-2xl text-navy-900">My Reports</h2>
              <Link to="/report" className="btn-primary text-sm px-4 py-2">+ New Report</Link>
            </div>

            {myIssues.length === 0 ? (
              <div className="card py-16 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-display font-bold text-xl text-navy-900 mb-2">No reports yet</h3>
                <p className="text-gray-500 font-body text-sm mb-6">Start by reporting a civic issue in your area</p>
                <Link to="/report" className="btn-primary text-sm inline-flex">Report Your First Issue</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

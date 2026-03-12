import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle, Clock, AlertCircle, Eye, ChevronDown, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo, STATUS_CONFIG, timeAgo, CATEGORIES } from '../utils/helpers';
import StatCard from '../components/StatCard';

const STATUS_TRANSITIONS = {
  'reported': ['in-progress', 'rejected'],
  'in-progress': ['resolved', 'reported'],
  'resolved': ['in-progress'],
  'rejected': ['reported'],
};

export default function AdminDashboard() {
  const { issues, updateIssueStatus, user } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="font-display font-bold text-2xl text-navy-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You need admin privileges to view this page.</p>
          <Link to="/feed" className="btn-primary text-sm inline-flex">Go to Feed</Link>
        </div>
      </div>
    );
  }

  const stats = {
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  const resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const filtered = issues.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.location?.address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    const matchCat = filterCat === 'all' || i.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const openNoteModal = (issue, newStatus) => {
    setNoteModal({ issue, newStatus });
    setNote('');
  };

  const confirmUpdate = () => {
    if (!noteModal) return;
    updateIssueStatus(noteModal.issue.id, noteModal.newStatus, note);
    setNoteModal(null);
    setNote('');
  };

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-4xl text-navy-900">Admin Dashboard</h1>
            <p className="text-gray-500 font-body mt-1">Manage and resolve citizen complaints</p>
          </div>
          <div className="bg-flame-500/10 text-flame-500 px-4 py-2 rounded-xl font-display font-semibold text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-flame-500 rounded-full animate-pulse" />
            {stats.reported} awaiting review
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Issues" value={stats.total} icon="📋" color="#ff6b35" />
          <StatCard label="Pending Review" value={stats.reported} icon="🚨" color="#f59e0b" change={12} />
          <StatCard label="In Progress" value={stats.inProgress} icon="🔧" color="#3b82f6" change={-5} />
          <StatCard label="Resolved" value={stats.resolved} icon="✅" color="#22c55e" change={8} />
        </div>

        {/* Resolution rate */}
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-flame-500" />
              <span className="font-display font-bold text-navy-900">Resolution Rate</span>
            </div>
            <span className="font-display font-extrabold text-2xl text-navy-900">{resolutionRate}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-flame-500 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${resolutionRate}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>0%</span><span>Target: 85%</span><span>100%</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {CATEGORIES.filter(c => c.id !== 'other').map(cat => {
            const count = issues.filter(i => i.category === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                className={`card p-4 text-center hover:shadow-md transition-all ${filterCat === cat.id ? 'ring-2' : ''}`}
                style={filterCat === cat.id ? { ringColor: cat.color } : {}}>
                <div className="text-xl mb-1">{cat.icon}</div>
                <div className="font-display font-extrabold text-lg" style={{ color: cat.color }}>{count}</div>
                <div className="text-xs text-gray-500 font-body">{cat.label}</div>
              </button>
            );
          })}
        </div>

        {/* Issues table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10 h-10 text-sm" placeholder="Search issues..." />
              </div>
              <div className="flex gap-2">
                {['all', 'reported', 'in-progress', 'resolved'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-display font-semibold border-2 transition-all
                      ${filterStatus === s ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Issue', 'Category', 'Status', 'Location', 'Reporter', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-display font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 font-body text-sm">
                      No issues found matching your criteria
                    </td>
                  </tr>
                ) : filtered.map(issue => {
                  const cat = getCategoryInfo(issue.category);
                  const statusCfg = STATUS_CONFIG[issue.status];
                  const transitions = STATUS_TRANSITIONS[issue.status] || [];
                  return (
                    <tr key={issue.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-display font-semibold text-sm text-navy-900 truncate">{issue.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{issue.upvotes} upvotes · {issue.comments?.length} comments</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: cat.bg, color: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[150px]">
                        <p className="text-xs text-gray-500 truncate">{issue.location?.address}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-600 font-semibold">{issue.reporterName}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-400">{timeAgo(issue.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link to={`/issue/${issue.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy-900 transition-colors">
                            <Eye size={14} />
                          </Link>
                          {transitions.map(newStatus => {
                            const targetCfg = STATUS_CONFIG[newStatus];
                            return (
                              <button key={newStatus} onClick={() => openNoteModal(issue, newStatus)}
                                className="text-xs font-display font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
                                style={{ backgroundColor: targetCfg.bg, color: targetCfg.color }}>
                                → {targetCfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <h3 className="font-display font-bold text-lg text-navy-900 mb-1">Update Status</h3>
            <p className="text-sm text-gray-500 mb-4">
              Changing <strong>"{noteModal.issue.title}"</strong> to{' '}
              <span className="font-semibold" style={{ color: STATUS_CONFIG[noteModal.newStatus].color }}>
                {STATUS_CONFIG[noteModal.newStatus].label}
              </span>
            </p>
            <label className="label">Add a note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              className="input-field resize-none h-24 mb-4 text-sm"
              placeholder="e.g. Assigned to PWD Department, work scheduled for Monday..." />
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={confirmUpdate} className="btn-primary flex-1 text-sm">Confirm Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

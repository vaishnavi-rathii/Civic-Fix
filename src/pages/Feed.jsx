import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, TrendingUp, Clock, ArrowUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IssueCard from '../components/IssueCard';
import { CATEGORIES, STATUS_CONFIG } from '../utils/helpers';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', icon: <Clock size={14} /> },
  { id: 'popular', label: 'Most Upvoted', icon: <ArrowUp size={14} /> },
  { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
];

export default function Feed() {
  const { issues } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...issues];
    if (search) list = list.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.address?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCat !== 'all') list = list.filter(i => i.category === filterCat);
    if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus);
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'popular') list.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === 'trending') list.sort((a, b) => (b.upvotes + b.comments.length) - (a.upvotes + a.comments.length));
    return list;
  }, [issues, search, filterCat, filterStatus, sort]);

  const counts = useMemo(() => ({
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  }), [issues]);

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-4xl text-navy-900 mb-2">Public Feed</h1>
          <p className="text-gray-500 font-body">All civic issues reported in your area</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Issues', value: counts.total, color: '#ff6b35' },
            { label: 'Reported', value: counts.reported, color: '#f59e0b' },
            { label: 'In Progress', value: counts.inProgress, color: '#3b82f6' },
            { label: 'Resolved', value: counts.resolved, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="font-display font-extrabold text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 font-body mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & controls */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 h-11" placeholder="Search issues, locations..." />
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setSort(opt.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all border-2
                    ${sort === opt.id ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  {opt.icon}<span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}

              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all border-2
                  ${showFilters || filterCat !== 'all' || filterStatus !== 'all' ? 'bg-flame-500 text-white border-flame-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                <SlidersHorizontal size={16} /><span className="hidden sm:inline">Filter</span>
                {(filterCat !== 'all' || filterStatus !== 'all') && <span className="w-2 h-2 bg-white rounded-full" />}
              </button>
            </div>
          </div>

          {/* Filters expanded */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
              {/* Category filter */}
              <div>
                <p className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCat('all')}
                    className={`category-pill px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all
                      ${filterCat === 'all' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    All
                  </button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                      className={`category-pill px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all flex items-center gap-1`}
                      style={filterCat === cat.id ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color } : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }}>
                      <span>{cat.icon}</span>{cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter */}
              <div>
                <p className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all
                      ${filterStatus === 'all' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                    All
                  </button>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button key={key} onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all`}
                      style={filterStatus === key ? { backgroundColor: val.color, color: 'white', borderColor: val.color } : { backgroundColor: val.bg, color: val.color, borderColor: val.bg }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 font-body">
            <span className="font-semibold text-navy-900">{filtered.length}</span> issues found
          </p>
          {(filterCat !== 'all' || filterStatus !== 'all' || search) && (
            <button onClick={() => { setFilterCat('all'); setFilterStatus('all'); setSearch(''); }}
              className="text-sm text-flame-500 font-display font-semibold hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="card py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display font-bold text-xl text-navy-900 mb-2">No issues found</h3>
            <p className="text-gray-500 font-body text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

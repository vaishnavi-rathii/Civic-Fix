import { useState, useMemo, useRef } from 'react';
import { Search, SlidersHorizontal, TrendingUp, Clock, ArrowUp, Sparkles, Loader, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IssueCard from '../components/IssueCard';
import { CATEGORIES, STATUS_CONFIG } from '../utils/helpers';
import { askClaude } from '../lib/claude';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest', icon: <Clock size={14} /> },
  { id: 'popular', label: 'Most Upvoted', icon: <ArrowUp size={14} /> },
  { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
];

const AI_SEARCH_SYSTEM = `You are a search assistant for a civic issues platform. Parse the natural language query into filter parameters.
Return ONLY valid JSON:
{"category":"pothole|garbage|streetlight|water|drainage|road|park|other|null","status":"reported|in-progress|resolved|null","location":"area name or null","minVotes":number or 0,"dateRange":"today|week|month|null","interpretation":"brief human-readable summary of what you understood"}
Use null for fields not mentioned. Be generous — if "pothole" is mentioned, set category to "pothole". If "open" or "unresolved", set status to "reported".`;

export default function Feed() {
  const { issues } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // AI Search state
  const [aiParsing, setAiParsing] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiFilters, setAiFilters] = useState(null);
  const inputRef = useRef(null);

  const handleAiSearch = async () => {
    if (!search.trim()) return;
    setAiParsing(true);
    setAiInterpretation('');
    setAiFilters(null);
    try {
      const raw = await askClaude(AI_SEARCH_SYSTEM, search, 300);
      const parsed = JSON.parse(raw);
      setAiFilters(parsed);
      setAiInterpretation(parsed.interpretation || '');
      if (parsed.category && parsed.category !== 'null') setFilterCat(parsed.category);
      if (parsed.status && parsed.status !== 'null') setFilterStatus(parsed.status);
    } catch { /* silently fall back to text search */ }
    finally { setAiParsing(false); }
  };

  const clearAiFilters = () => {
    setAiFilters(null); setAiInterpretation('');
    setFilterCat('all'); setFilterStatus('all'); setSearch('');
  };

  const getDateThreshold = (range) => {
    if (!range || range === 'null') return null;
    const now = new Date();
    if (range === 'today') return new Date(now - 86400000);
    if (range === 'week') return new Date(now - 7 * 86400000);
    if (range === 'month') return new Date(now - 30 * 86400000);
    return null;
  };

  const filtered = useMemo(() => {
    let list = [...issues];
    const threshold = aiFilters ? getDateThreshold(aiFilters.dateRange) : null;

    if (search && !aiFilters) {
      list = list.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        i.location?.address?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (search && aiFilters && aiFilters.location && aiFilters.location !== 'null') {
      list = list.filter(i => i.location?.address?.toLowerCase().includes(aiFilters.location.toLowerCase()));
    }
    if (filterCat !== 'all') list = list.filter(i => i.category === filterCat);
    if (filterStatus !== 'all') list = list.filter(i => i.status === filterStatus);
    if (aiFilters?.minVotes > 0) list = list.filter(i => i.upvotes >= aiFilters.minVotes);
    if (threshold) list = list.filter(i => new Date(i.createdAt) >= threshold);

    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'popular') list.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === 'trending') list.sort((a, b) => (b.upvotes + b.comments.length) - (a.upvotes + a.comments.length));
    return list;
  }, [issues, search, filterCat, filterStatus, sort, aiFilters]);

  const counts = useMemo(() => ({
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  }), [issues]);

  const isFiltered = filterCat !== 'all' || filterStatus !== 'all' || search;

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {/* AI Search bar */}
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                {aiParsing
                  ? <Loader size={15} className="text-flame-500 animate-spin" />
                  : <Sparkles size={15} className={`transition-colors ${search ? 'text-flame-500' : 'text-gray-300'}`} />}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); if (!e.target.value) clearAiFilters(); }}
                onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                className="input-field pl-10 pr-10 h-11"
                placeholder="AI Search: 'urgent drainage in Dwarka' or 'potholes with 5+ votes'…"
              />
              {search && (
                <button onClick={clearAiFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
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

          {/* AI interpretation tag */}
          {aiInterpretation && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-flame-500/8 border border-flame-500/20 rounded-lg">
                <Sparkles size={12} className="text-flame-500" />
                <span className="text-xs font-display font-semibold text-flame-600">AI interpreted: {aiInterpretation}</span>
              </div>
              <button onClick={clearAiFilters} className="text-xs text-gray-400 hover:text-gray-600 font-body underline">Clear</button>
            </div>
          )}

          {/* Press Enter hint */}
          {search && !aiInterpretation && !aiParsing && (
            <p className="mt-2 text-xs text-gray-400 font-body">Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono text-xs">Enter</kbd> for AI-powered search</p>
          )}

          {/* Filters expanded */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
              <div>
                <p className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterCat('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all
                      ${filterCat === 'all' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>All</button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? 'all' : cat.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all flex items-center gap-1"
                      style={filterCat === cat.id ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color } : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }}>
                      <span>{cat.icon}</span>{cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-display font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all
                      ${filterStatus === 'all' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200'}`}>All</button>
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button key={key} onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold border-2 transition-all"
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
          {isFiltered && (
            <button onClick={clearAiFilters} className="text-sm text-flame-500 font-display font-semibold hover:underline">Clear filters</button>
          )}
        </div>

        {filtered.length === 0 ? (
          isFiltered ? (
            <div className="card py-24 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display font-bold text-xl text-navy-900 mb-2">No issues found</h3>
              <p className="text-gray-500 font-body text-sm">Try adjusting your filters or search terms</p>
              <button onClick={clearAiFilters} className="mt-4 btn-primary text-sm">Clear Filters</button>
            </div>
          ) : (
            <div className="card py-24 text-center">
              <div className="text-7xl mb-5">🏙️</div>
              <h3 className="font-display font-extrabold text-2xl text-navy-900 mb-2">No issues yet</h3>
              <p className="text-gray-500 font-body mb-6">Be the first to report a civic issue in your area!</p>
              <a href="/report" className="btn-primary text-sm inline-flex items-center gap-2">
                <span>+</span> Report an Issue
              </a>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  );
}

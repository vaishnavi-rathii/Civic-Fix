import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, AlertCircle, Eye, Search, Sparkles, Loader, X, Bot, TrendingUp, MapPin, MessageSquare, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo, STATUS_CONFIG, timeAgo, CATEGORIES } from '../utils/helpers';
import StatCard from '../components/StatCard';
import AIBadge from '../components/AIBadge';
import { askClaude } from '../lib/claude';

const STATUS_TRANSITIONS = {
  'reported': ['in-progress', 'rejected'],
  'in-progress': ['resolved', 'reported'],
  'resolved': ['in-progress'],
  'rejected': ['reported'],
};

// Circular SVG progress
function CircleScore({ score, max = 100, label, color }) {
  const r = 54, c = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#1e2d4a" strokeWidth="12" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-extrabold text-3xl text-white">{score}</span>
          <span className="text-xs text-white/40 font-body">/{max}</span>
        </div>
      </div>
      <span className="font-display font-semibold text-sm" style={{ color }}>{label}</span>
    </div>
  );
}

// Sentiment gauge
function SentimentGauge({ sentiment }) {
  const MAP = { Positive: { pct: 85, color: '#22c55e' }, Neutral: { pct: 50, color: '#f59e0b' }, Frustrated: { pct: 30, color: '#f97316' }, Angry: { pct: 10, color: '#ef4444' } };
  const { pct, color } = MAP[sentiment] || MAP.Neutral;
  return (
    <div>
      <div className="flex justify-between text-xs text-white/40 font-body mb-1.5">
        <span>Angry</span><span>Neutral</span><span>Positive</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="font-display font-bold text-sm mt-1.5" style={{ color }}>{sentiment}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { issues, updateIssueStatus, user } = useApp();
  const [activeTab, setActiveTab] = useState('issues');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');

  // AI states
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [priorityData, setPriorityData] = useState(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [hotspots, setHotspots] = useState(null);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [resolvePanel, setResolvePanel] = useState(null);
  const [resolveData, setResolveData] = useState({});
  const [resolveLoading, setResolveLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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

  const openNoteModal = (issue, newStatus) => { setNoteModal({ issue, newStatus }); setNote(''); };
  const confirmUpdate = () => { if (!noteModal) return; updateIssueStatus(noteModal.issue.id, noteModal.newStatus, note); setNoteModal(null); setNote(''); };

  const callAI = async (setter, setLoading, systemPrompt, userMsg) => {
    setLoading(true); setAiError('');
    try {
      const raw = await askClaude(systemPrompt, userMsg, 800);
      setter(JSON.parse(raw));
    } catch { setAiError('AI service error. Check your API key.'); }
    finally { setLoading(false); }
  };

  // 3a. City Health Score
  const fetchHealth = () => callAI(setHealthData, setHealthLoading,
    'You are a civic analytics assistant. Analyse the issues and return ONLY valid JSON: {"score":0-100,"label":"Poor|Fair|Good|Excellent","color":"#hex","narrative":"2-3 sentences explaining the score and key factors"}',
    `Total:${stats.total}, Resolved:${stats.resolved}, InProgress:${stats.inProgress}, Pending:${stats.reported}, ResolutionRate:${resolutionRate}%`
  );

  // 3b. Priority Actions
  const fetchPriority = () => callAI(setPriorityData, setPriorityLoading,
    'You are a civic issue manager. Return ONLY valid JSON: {"actions":[{"rank":1,"icon":"emoji","title":"short title","issueRef":"brief ref","reason":"why urgent"},...5 items]}',
    `Open issues:\n${issues.filter(i => i.status !== 'resolved').slice(0, 15).map(i => `[${i.status}] ${i.title} (${i.category}) @ ${i.location?.address}`).join('\n')}`
  );

  // 3c. Hotspots
  const fetchHotspots = () => callAI(setHotspots, setHotspotsLoading,
    'Analyse issue locations and categories. Return ONLY valid JSON: {"hotspots":[{"area":"area name","issueCount":n,"topCategory":"category","description":"one line insight"},...3 items]}',
    issues.map(i => `${i.location?.address} | ${i.category} | ${i.status}`).join('\n')
  );

  // 3d. Sentiment
  const fetchSentiment = () => {
    const allComments = issues.flatMap(i => i.comments || []).map(c => c.text).join('\n');
    callAI(setSentiment, setSentimentLoading,
      'Analyse citizen comments for sentiment. Return ONLY valid JSON: {"overall":"Positive|Neutral|Frustrated|Angry","topFrustrated":[{"complaint":"text","urgency":"why it needs attention"},...3 items],"responseTemplate":"suggested template for angry citizens"}',
      allComments || 'No comments yet.'
    );
  };

  // 3e. Resolution Suggester
  const fetchResolution = async (issue) => {
    setResolvePanel(issue); setResolveLoading(true);
    try {
      const raw = await askClaude(
        'You are a civic resolution expert. Return ONLY valid JSON: {"rootCause":"...","resolutionPlan":["step1","step2","step3"],"department":"sub-dept/contractor","budgetRange":"₹X–₹Y","citizenResponse":"draft reply to citizen"}',
        `Issue: ${issue.title}\nCategory: ${issue.category}\nDescription: ${issue.description}\nLocation: ${issue.location?.address}\nStatus: ${issue.status}`,
        600
      );
      setResolveData(d => ({ ...d, [issue.id]: JSON.parse(raw) }));
    } catch { setAiError('Resolution analysis failed.'); }
    finally { setResolveLoading(false); }
  };

  const AILoadingDots = ({ text = 'CivicFix AI is thinking...' }) => (
    <div className="flex items-center gap-2 text-flame-400 py-6 justify-center">
      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      <span className="text-sm font-body ml-1">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
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

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
              ${activeTab === 'issues' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-900'}`}>
            📋 Issues
          </button>
          <button onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all
              ${activeTab === 'ai' ? 'bg-navy-900 text-white shadow-sm' : 'text-gray-500 hover:text-navy-900'}`}>
            <Bot size={15} /> 🤖 AI Insights
          </button>
        </div>

        {/* ─── AI INSIGHTS TAB ─── */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-body flex items-center gap-2">
                <AlertCircle size={14} />{aiError}
              </div>
            )}

            {/* 3a. City Health Score */}
            <div className="bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2"><TrendingUp size={16} className="text-flame-400" /><span className="font-display font-bold text-white">City Health Score</span></div>
                <div className="flex items-center gap-3"><AIBadge />
                  <button onClick={fetchHealth} disabled={healthLoading}
                    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg bg-flame-500 text-white hover:bg-flame-600 transition-all disabled:opacity-50">
                    {healthLoading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {healthData ? 'Refresh' : 'Generate'}
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {healthLoading && <AILoadingDots />}
                {!healthLoading && !healthData && (
                  <p className="text-white/30 text-sm font-body text-center py-4">Click Generate to analyse Delhi's civic health score</p>
                )}
                {!healthLoading && healthData && (
                  <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
                    <CircleScore score={healthData.score} label={healthData.label} color={healthData.color || '#ff6b35'} />
                    <div className="flex-1">
                      <p className="font-display font-bold text-white text-base mb-2">Delhi Civic Health: {healthData.score}/100 — {healthData.label}</p>
                      <p className="text-white/60 font-body text-sm leading-relaxed">{healthData.narrative}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10">
                <span className="text-flame-400 text-xs">⚡</span>
                <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
              </div>
            </div>

            {/* 3b. Priority Actions */}
            <div className="bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-flame-400" /><span className="font-display font-bold text-white">Priority Action List</span></div>
                <div className="flex items-center gap-3"><AIBadge />
                  <button onClick={fetchPriority} disabled={priorityLoading}
                    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg bg-flame-500 text-white hover:bg-flame-600 transition-all disabled:opacity-50">
                    {priorityLoading ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Generate Priority Actions
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {priorityLoading && <AILoadingDots />}
                {!priorityLoading && !priorityData && (
                  <p className="text-white/30 text-sm font-body text-center py-4">Generate a ranked list of 5 actions to take today</p>
                )}
                {!priorityLoading && priorityData?.actions && (
                  <div className="space-y-3 animate-fade-in">
                    {priorityData.actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                        <div className="w-7 h-7 rounded-full bg-flame-500 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0">{a.rank}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{a.icon}</span>
                            <span className="font-display font-bold text-white text-sm">{a.title}</span>
                          </div>
                          <p className="text-xs text-white/40 font-body">{a.issueRef}</p>
                          <p className="text-xs text-flame-400 font-body mt-1">{a.reason}</p>
                        </div>
                        <ChevronRight size={14} className="text-white/20 flex-shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10">
                <span className="text-flame-400 text-xs">⚡</span>
                <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
              </div>
            </div>

            {/* 3c. Cluster / Hotspots */}
            <div className="bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-flame-400" /><span className="font-display font-bold text-white">Problem Hotspots</span></div>
                <div className="flex items-center gap-3"><AIBadge />
                  <button onClick={fetchHotspots} disabled={hotspotsLoading}
                    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg bg-flame-500 text-white hover:bg-flame-600 transition-all disabled:opacity-50">
                    {hotspotsLoading ? <Loader size={12} className="animate-spin" /> : <MapPin size={12} />}
                    Find Hotspots
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {hotspotsLoading && <AILoadingDots />}
                {!hotspotsLoading && !hotspots && (
                  <p className="text-white/30 text-sm font-body text-center py-4">Identify the top 3 geographic problem clusters</p>
                )}
                {!hotspotsLoading && hotspots?.hotspots && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                    {hotspots.hotspots.map((h, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-flame-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">#{i+1}</div>
                          <span className="font-display font-bold text-white text-sm truncate">{h.area}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-flame-400 font-extrabold font-display text-xl">{h.issueCount}</span>
                          <span className="text-white/40 text-xs font-body">issues · {h.topCategory}</span>
                        </div>
                        <p className="text-xs text-white/50 font-body leading-relaxed">{h.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10">
                <span className="text-flame-400 text-xs">⚡</span>
                <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
              </div>
            </div>

            {/* 3d. Sentiment Pulse */}
            <div className="bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden">
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2"><MessageSquare size={16} className="text-flame-400" /><span className="font-display font-bold text-white">Sentiment Pulse</span></div>
                <div className="flex items-center gap-3"><AIBadge />
                  <button onClick={fetchSentiment} disabled={sentimentLoading}
                    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg bg-flame-500 text-white hover:bg-flame-600 transition-all disabled:opacity-50">
                    {sentimentLoading ? <Loader size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                    Analyse Sentiment
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {sentimentLoading && <AILoadingDots />}
                {!sentimentLoading && !sentiment && (
                  <p className="text-white/30 text-sm font-body text-center py-4">Analyse citizen sentiment from all comments</p>
                )}
                {!sentimentLoading && sentiment && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-3">Overall Citizen Sentiment</p>
                      <SentimentGauge sentiment={sentiment.overall} />
                    </div>
                    {sentiment.topFrustrated?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">Top Frustrated Complaints</p>
                        <div className="space-y-2">
                          {sentiment.topFrustrated.map((f, i) => (
                            <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                              <p className="text-xs text-red-300 font-body leading-relaxed">"{f.complaint}"</p>
                              <p className="text-[10px] text-red-400/60 font-body mt-1">{f.urgency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sentiment.responseTemplate && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">Suggested Response Template</p>
                        <p className="text-xs text-white/60 font-body leading-relaxed italic">"{sentiment.responseTemplate}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10">
                <span className="text-flame-400 text-xs">⚡</span>
                <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
              </div>
            </div>

            {/* 3e hint */}
            <div className="bg-white/60 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <Bot size={18} className="text-flame-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 font-body">
                <span className="font-semibold text-navy-900">Auto-Resolution Suggester:</span> Switch to the Issues tab and click the <span className="text-flame-500 font-semibold">🤖</span> button on any issue row to get AI-powered resolution suggestions.
              </p>
            </div>
          </div>
        )}

        {/* ─── ISSUES TAB ─── */}
        {activeTab === 'issues' && (
          <div className="animate-fade-in">
            {/* Resolution rate */}
            <div className="card p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><BarChart3 size={18} className="text-flame-500" /><span className="font-display font-bold text-navy-900">Resolution Rate</span></div>
                <span className="font-display font-extrabold text-2xl text-navy-900">{resolutionRate}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-flame-500 to-green-500 rounded-full transition-all duration-1000" style={{ width: `${resolutionRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2"><span>0%</span><span>Target: 85%</span><span>100%</span></div>
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
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-display font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-body text-sm">No issues found matching your criteria</td></tr>
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
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.icon} {cat.label}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-[150px]"><p className="text-xs text-gray-500 truncate">{issue.location?.address}</p></td>
                          <td className="px-5 py-4 whitespace-nowrap"><p className="text-xs text-gray-600 font-semibold">{issue.reporterName}</p></td>
                          <td className="px-5 py-4 whitespace-nowrap"><p className="text-xs text-gray-400">{timeAgo(issue.createdAt)}</p></td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link to={`/issue/${issue.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy-900 transition-colors"><Eye size={14} /></Link>
                              {/* 3e: AI resolve button */}
                              <button onClick={() => fetchResolution(issue)} title="AI Resolution Suggester"
                                className="p-1.5 rounded-lg hover:bg-flame-500/10 text-gray-400 hover:text-flame-500 transition-colors">
                                <Bot size={14} />
                              </button>
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
        )}
      </div>

      {/* 3e: Resolution Suggester Panel */}
      {resolvePanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setResolvePanel(null)} />
          <div className="relative w-full max-w-md bg-navy-900 h-full overflow-y-auto shadow-2xl animate-slide-up">
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-navy-900 z-10">
              <div className="flex items-center gap-2"><Bot size={16} className="text-flame-400" /><span className="font-display font-bold text-white">AI Resolution Suggester</span></div>
              <button onClick={() => setResolvePanel(null)} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"><X size={15} className="text-white/60" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-white/40 font-body mb-1">Analysing</p>
                <p className="font-display font-bold text-white text-sm">{resolvePanel.title}</p>
                <p className="text-xs text-flame-400/70 font-body mt-1">{resolvePanel.category} · {resolvePanel.location?.address}</p>
              </div>
              {resolveLoading && (
                <div className="flex items-center gap-2 text-flame-400 py-4 justify-center">
                  <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-sm font-body ml-1">Analysing issue…</span>
                </div>
              )}
              {!resolveLoading && resolveData[resolvePanel.id] && (() => {
                const d = resolveData[resolvePanel.id];
                return (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">Root Cause</p>
                      <p className="text-sm text-white/80 font-body leading-relaxed">{d.rootCause}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">Resolution Plan</p>
                      <div className="space-y-2">
                        {d.resolutionPlan?.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-flame-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                            <p className="text-xs text-white/70 font-body leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Department</p>
                        <p className="text-xs text-white font-display font-semibold">{d.department}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Est. Budget</p>
                        <p className="text-xs text-flame-400 font-display font-bold">{d.budgetRange}</p>
                      </div>
                    </div>
                    {d.citizenResponse && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-2">Draft Response to Citizen</p>
                        <p className="text-xs text-white/60 font-body leading-relaxed italic">"{d.citizenResponse}"</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="px-5 pb-5 border-t border-white/10">
              <p className="text-[10px] text-white/20 font-body mt-3 text-center">⚡ Powered by CivicFix AI · Results are AI-generated suggestions</p>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <h3 className="font-display font-bold text-lg text-navy-900 mb-1">Update Status</h3>
            <p className="text-sm text-gray-500 mb-4">
              Changing <strong>"{noteModal.issue.title}"</strong> to{' '}
              <span className="font-semibold" style={{ color: STATUS_CONFIG[noteModal.newStatus].color }}>{STATUS_CONFIG[noteModal.newStatus].label}</span>
            </p>
            <label className="label">Add a note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} className="input-field resize-none h-24 mb-4 text-sm"
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

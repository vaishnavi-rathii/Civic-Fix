import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, ArrowUp, MessageSquare, Clock, Send, User, Bot, RefreshCw, Loader, Link2, Printer, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo, STATUS_CONFIG, timeAgo, formatDate } from '../utils/helpers';
import { askClaude } from '../lib/claude';
import AIBadge from '../components/AIBadge';

const STATUS_META = {
  reported:    { icon: '🟡', label: 'Reported',    color: '#f59e0b' },
  'in-review': { icon: '🔵', label: 'In Review',   color: '#3b82f6' },
  'in-progress':{ icon: '🔧', label: 'In Progress', color: '#6366f1' },
  resolved:    { icon: '✅', label: 'Resolved',    color: '#22c55e' },
  rejected:    { icon: '❌', label: 'Rejected',    color: '#ef4444' },
};

const NARRATOR_SYSTEM = `You are CivicFix AI, an assistant that explains civic issue status to citizens in plain, warm English.
Return ONLY valid JSON:
{"statusUpdate":"plain English status update 2-3 sentences mentioning the department if applicable","nextAction":"what the citizen should expect next (1 sentence)","citizenTip":"actionable tip about RTI or escalation if relevant (1 sentence)","confidence":0-100,"confidenceLabel":"Low|Medium|High"}`;

export default function IssueDetail() {
  const { id } = useParams();
  const { issues, upvoteIssue, addComment, user } = useApp();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const issue = issues.find(i => i.id === id);

  useEffect(() => {
    if (issue && !aiDone) fetchAiSummary();
  }, [id]);

  const fetchAiSummary = async () => {
    if (!issue) return;
    setAiLoading(true);
    try {
      const commentsText = issue.comments?.map(c => `${c.author}: ${c.text}`).join('\n') || 'No comments yet.';
      const ageHours = Math.round((Date.now() - new Date(issue.createdAt)) / 36e5);
      const raw = await askClaude(NARRATOR_SYSTEM,
        `Issue: ${issue.title}\nCategory: ${issue.category}\nDescription: ${issue.description}\nStatus: ${issue.status}\nAge: ${ageHours} hours\nLocation: ${issue.location?.address}\nComments:\n${commentsText}`,
        400);
      setAiSummary(JSON.parse(raw));
      setAiDone(true);
    } catch { /* silently skip */ }
    finally { setAiLoading(false); }
  };

  if (!issue) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h2 className="font-display font-bold text-2xl text-navy-900 mb-2">Issue not found</h2>
        <button onClick={() => navigate('/feed')} className="text-flame-500 font-semibold">Back to Feed</button>
      </div>
    </div>
  );

  const cat = getCategoryInfo(issue.category);
  const status = STATUS_CONFIG[issue.status];

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment(issue.id, comment.trim());
    setComment('');
  };

  const confidenceColor = (c) => c >= 70 ? '#22c55e' : c >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 font-display font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">

            {/* Feature 10: AI Summary card */}
            {(aiLoading || aiSummary) && (
              <div className="bg-navy-900 rounded-2xl overflow-hidden shadow-lg shadow-flame-500/10"
                style={{ border: '1px solid', borderImage: 'linear-gradient(135deg, #ff6b35, transparent) 1' }}>
                <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bot size={15} className="text-flame-400" />
                    <span className="font-display font-bold text-white text-sm">🤖 AI Summary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AIBadge />
                    <button onClick={() => { setAiSummary(null); setAiDone(false); setTimeout(fetchAiSummary, 100); }}
                      disabled={aiLoading}
                      className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40">
                      <RefreshCw size={12} className={`text-white/50 ${aiLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="px-5 py-4">
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-flame-400 py-2">
                      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-sm font-body ml-1">CivicFix AI is thinking...</span>
                    </div>
                  )}
                  {!aiLoading && aiSummary && (
                    <div className="space-y-3 animate-fade-in">
                      <p className="text-white/80 font-body text-sm leading-relaxed">{aiSummary.statusUpdate}</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 bg-white/5 rounded-xl p-3">
                          <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Next Expected Action</p>
                          <p className="text-xs text-flame-400 font-body">{aiSummary.nextAction}</p>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-xl p-3">
                          <p className="text-[10px] font-display font-bold text-white/40 uppercase tracking-wider mb-1">Citizen Tip</p>
                          <p className="text-xs text-white/60 font-body">{aiSummary.citizenTip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-white/40 font-body">Resolution Confidence:</p>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${aiSummary.confidence}%`, backgroundColor: confidenceColor(aiSummary.confidence) }} />
                        </div>
                        <span className="text-xs font-display font-bold" style={{ color: confidenceColor(aiSummary.confidence) }}>{aiSummary.confidence}% {aiSummary.confidenceLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-3 flex items-center gap-1.5 border-t border-white/10">
                  <span className="text-flame-400 text-xs">⚡</span>
                  <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · AI-generated suggestions</span>
                </div>
              </div>
            )}

            {/* Issue header card */}
            <div className="card overflow-hidden">
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              {issue.photo && <img src={issue.photo} alt={issue.title} className="w-full max-h-64 object-cover" />}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-display font-semibold" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.icon} {cat.label}</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-semibold" style={{ backgroundColor: status.bg, color: status.color }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}
                  </span>
                </div>
                <h1 className="font-display font-extrabold text-2xl text-navy-900 mb-3 leading-tight">{issue.title}</h1>
                <p className="text-gray-600 font-body leading-relaxed mb-5">{issue.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-flame-500" /><span>{issue.location?.address}</span></div>
                  <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{formatDate(issue.createdAt)}</span></div>
                  <div className="flex items-center gap-1.5"><User size={14} /><span>{issue.reporterName}</span></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                  <button onClick={() => user && upvoteIssue(issue.id)}
                    className="flex items-center gap-2 bg-flame-500/10 text-flame-500 px-4 py-2 rounded-xl font-display font-semibold text-sm hover:bg-flame-500/20 transition-colors">
                    <ArrowUp size={15} /> Upvote ({issue.upvotes})
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400"><MessageSquare size={15} /><span>{issue.comments?.length || 0} comments</span></div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-display font-semibold text-gray-600 hover:border-navy-900 hover:text-navy-900 transition-all">
                      {linkCopied ? <><CheckCircle size={13} className="text-green-500" /> Copied!</> : <><Link2 size={13} /> Copy Link</>}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-display font-semibold text-gray-600 hover:border-navy-900 hover:text-navy-900 transition-all print:hidden">
                      <Printer size={13} /> Print
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-lg text-navy-900 mb-5">Comments ({issue.comments?.length || 0})</h3>
              {user && (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0 mt-1">{user.avatar}</div>
                  <div className="flex-1 relative">
                    <input value={comment} onChange={e => setComment(e.target.value)} className="input-field pr-12 text-sm" placeholder="Add a comment..." />
                    <button type="submit" disabled={!comment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-flame-500 text-white rounded-lg hover:bg-flame-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              )}
              {issue.comments?.length === 0 ? (
                <div className="text-center py-8"><MessageSquare size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-400 font-body">No comments yet. Be the first!</p></div>
              ) : (
                <div className="space-y-4">
                  {issue.comments?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-display font-bold flex items-center justify-center flex-shrink-0">{c.author?.charAt(0)}</div>
                      <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-semibold text-sm text-navy-900">{c.author}</span>
                          <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 font-body">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-5 print-timeline">
              <h3 className="font-display font-bold text-base text-navy-900 mb-5">Status Timeline</h3>
              {issue.statusHistory && issue.statusHistory.length > 0 ? (
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[15px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-flame-500/40 to-gray-100" />
                  <div className="space-y-0">
                    {issue.statusHistory.map((entry, idx) => {
                      const meta = STATUS_META[entry.status] || { icon: '📌', label: entry.status, color: '#6b7280' };
                      const isLast = idx === issue.statusHistory.length - 1;
                      const isCurrent = isLast;
                      return (
                        <div key={idx} className="relative flex items-start gap-3 pl-1 pb-5 last:pb-0">
                          {/* Icon bubble */}
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 border-2 bg-white transition-all
                            ${isCurrent ? 'shadow-lg' : 'opacity-80'}`}
                            style={{ borderColor: isCurrent ? meta.color : '#e5e7eb' }}>
                            {isCurrent && (
                              <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                                style={{ backgroundColor: meta.color }} />
                            )}
                            <span className="text-sm">{meta.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`font-display font-bold text-sm ${isCurrent ? 'text-navy-900' : 'text-gray-500'}`}
                              style={isCurrent ? { color: meta.color } : {}}>
                              {meta.label}
                              {isCurrent && <span className="ml-2 text-[10px] font-body px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: meta.color }}>Current</span>}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-500 font-body mt-0.5 leading-relaxed">{entry.note}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock size={10} />{timeAgo(entry.date)}
                              <span className="text-gray-300">·</span>
                              <span>{formatDate(entry.date).split(',')[0]}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 font-body">No status history yet.</p>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-3">Location</h3>
              <div className="bg-gray-50 rounded-xl h-36 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
                <div className="relative z-10 text-center">
                  <div className="w-8 h-8 bg-flame-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg"><MapPin size={16} className="text-white" /></div>
                  <p className="text-xs font-display font-semibold text-gray-600">{issue.location?.address?.split(',')[0]}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><MapPin size={11} className="text-flame-500" />{issue.location?.address}</p>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-4">Reporter</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white font-display font-bold flex items-center justify-center">{issue.reporterName?.charAt(0)}</div>
                <div><p className="font-display font-semibold text-navy-900 text-sm">{issue.reporterName}</p><p className="text-xs text-gray-400">Citizen reporter</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

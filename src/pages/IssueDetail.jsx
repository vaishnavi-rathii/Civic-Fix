import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, ArrowUp, MessageSquare, CheckCircle, Clock, Send, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo, STATUS_CONFIG, timeAgo, formatDate } from '../utils/helpers';

const STATUS_ORDER = ['reported', 'in-progress', 'resolved'];

export default function IssueDetail() {
  const { id } = useParams();
  const { issues, upvoteIssue, addComment, user } = useApp();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');

  const issue = issues.find(i => i.id === id);
  if (!issue) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h2 className="font-display font-bold text-2xl text-navy-900 mb-2">Issue not found</h2>
        <Link to="/feed" className="text-flame-500 font-semibold">Back to Feed</Link>
      </div>
    </div>
  );

  const cat = getCategoryInfo(issue.category);
  const status = STATUS_CONFIG[issue.status];
  const currentStatusIdx = STATUS_ORDER.indexOf(issue.status);

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment(issue.id, comment.trim());
    setComment('');
  };

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 font-display font-semibold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Issue header card */}
            <div className="card overflow-hidden">
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              {issue.photo && (
                <img src={issue.photo} alt={issue.title} className="w-full max-h-64 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-display font-semibold"
                    style={{ backgroundColor: cat.bg, color: cat.color }}>
                    {cat.icon} {cat.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-display font-semibold"
                    style={{ backgroundColor: status.bg, color: status.color }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{status.label}
                  </span>
                </div>

                <h1 className="font-display font-extrabold text-2xl text-navy-900 mb-3 leading-tight">{issue.title}</h1>
                <p className="text-gray-600 font-body leading-relaxed mb-5">{issue.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-flame-500" />
                    <span>{issue.location?.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    <span>{issue.reporterName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-5 pt-5 border-t border-gray-100">
                  <button onClick={() => user && upvoteIssue(issue.id)}
                    className="flex items-center gap-2 bg-flame-500/10 text-flame-500 px-4 py-2 rounded-xl font-display font-semibold text-sm hover:bg-flame-500/20 transition-colors">
                    <ArrowUp size={15} /> Upvote ({issue.upvotes})
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageSquare size={15} />
                    <span>{issue.comments?.length || 0} comments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-lg text-navy-900 mb-5">
                Comments ({issue.comments?.length || 0})
              </h3>

              {user && (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0 mt-1">
                    {user.avatar}
                  </div>
                  <div className="flex-1 relative">
                    <input value={comment} onChange={e => setComment(e.target.value)}
                      className="input-field pr-12 text-sm" placeholder="Add a comment..." />
                    <button type="submit" disabled={!comment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-flame-500 text-white rounded-lg hover:bg-flame-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              )}

              {issue.comments?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400 font-body">No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {issue.comments?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs font-display font-bold flex items-center justify-center flex-shrink-0">
                        {c.author?.charAt(0)}
                      </div>
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
            {/* Status tracker */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-5">Status Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
                <div className="space-y-5">
                  {[
                    { key: 'reported', label: 'Reported', icon: '🚨', desc: 'Issue submitted by citizen' },
                    { key: 'in-progress', label: 'In Progress', icon: '🔧', desc: 'Assigned to department' },
                    { key: 'resolved', label: 'Resolved', icon: '✅', desc: 'Issue fixed & closed' },
                  ].map((s, idx) => {
                    const done = STATUS_ORDER.indexOf(s.key) <= currentStatusIdx;
                    const active = s.key === issue.status;
                    const histEntry = issue.statusHistory?.find(h => h.status === s.key);
                    return (
                      <div key={s.key} className="relative flex items-start gap-4 pl-2">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 transition-all
                          ${done ? 'bg-white border-green-400' : 'bg-white border-gray-200'} 
                          ${active ? 'ring-4 ring-flame-500/20 border-flame-500' : ''}`}>
                          {s.icon}
                        </div>
                        <div className="pb-1">
                          <p className={`font-display font-bold text-sm ${done ? 'text-navy-900' : 'text-gray-400'}`}>{s.label}</p>
                          {histEntry ? (
                            <>
                              <p className="text-xs text-gray-500 font-body mt-0.5">{histEntry.note}</p>
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock size={10} />{timeAgo(histEntry.date)}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-300 font-body mt-0.5">{s.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-3">Location</h3>
              <div className="bg-gray-50 rounded-xl h-36 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }} />
                <div className="relative z-10 text-center">
                  <div className="w-8 h-8 bg-flame-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <p className="text-xs font-display font-semibold text-gray-600">{issue.location?.address?.split(',')[0]}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <MapPin size={11} className="text-flame-500" />
                {issue.location?.address}
              </p>
            </div>

            {/* Reporter info */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 mb-4">Reporter</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white font-display font-bold flex items-center justify-center">
                  {issue.reporterName?.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-semibold text-navy-900 text-sm">{issue.reporterName}</p>
                  <p className="text-xs text-gray-400">Citizen reporter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

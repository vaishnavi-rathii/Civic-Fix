import { Link } from 'react-router-dom';
import { MapPin, ArrowUp, MessageSquare, Clock } from 'lucide-react';
import { getCategoryInfo, STATUS_CONFIG, timeAgo } from '../utils/helpers';
import { useApp } from '../context/AppContext';

export default function IssueCard({ issue, compact = false }) {
  const { upvoteIssue, user } = useApp();
  const cat = getCategoryInfo(issue.category);
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG['reported'];

  return (
    <div className="card hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Category color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: cat.color }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-semibold"
              style={{ backgroundColor: cat.bg, color: cat.color }}>
              <span>{cat.icon}</span> {cat.label}
            </span>
            {/* Status badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-semibold"
              style={{ backgroundColor: status.bg, color: status.color }}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/issue/${issue.id}`}>
          <h3 className="font-display font-bold text-navy-900 text-base mb-2 group-hover:text-flame-500 transition-colors leading-tight line-clamp-2">
            {issue.title}
          </h3>
        </Link>

        {!compact && (
          <p className="text-sm text-gray-500 font-body line-clamp-2 mb-4 leading-relaxed">
            {issue.description}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{issue.location?.address || 'Location not specified'}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <button
              onClick={(e) => { e.preventDefault(); if (user) upvoteIssue(issue.id); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-flame-500 transition-colors group/btn"
            >
              <ArrowUp size={14} className="group-hover/btn:scale-110 transition-transform" />
              <span>{issue.upvotes}</span>
            </button>

            {/* Comments */}
            <Link to={`/issue/${issue.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-900 transition-colors">
              <MessageSquare size={14} />
              <span>{issue.comments?.length || 0}</span>
            </Link>
          </div>

          {/* Reporter & Time */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-navy-900 text-white text-xs font-display font-bold flex items-center justify-center flex-shrink-0">
              {issue.reporterName?.charAt(0) || '?'}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              <span>{timeAgo(issue.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

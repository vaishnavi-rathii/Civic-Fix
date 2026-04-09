import AIBadge from './AIBadge';

export default function AIAnalysisCard({ title, children, className = '' }) {
  return (
    <div className={`bg-navy-900 border-l-4 border-flame-500 rounded-2xl shadow-lg shadow-flame-500/10 overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
        <span className="font-display font-bold text-white text-sm">{title}</span>
        <AIBadge />
      </div>
      <div className="px-5 py-4">{children}</div>
      <div className="px-5 pb-3.5 flex items-center gap-1.5 border-t border-white/10 mt-1">
        <span className="text-flame-400 text-xs">⚡</span>
        <span className="text-white/30 text-xs font-body">Powered by CivicFix AI · Results are AI-generated suggestions</span>
      </div>
    </div>
  );
}

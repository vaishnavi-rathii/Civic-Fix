export default function AIBadge({ text = 'AI Powered' }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-flame-500/10 border border-flame-500/30 text-flame-400 text-xs font-medium">
      ✦ {text}
    </span>
  );
}

export default function StatCard({ label, value, icon, color = '#ff6b35', change }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: color + '20' }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-extrabold text-navy-900">{value}</p>
        <p className="text-sm text-gray-500 font-body">{label}</p>
        {change !== undefined && (
          <p className={`text-xs font-semibold mt-0.5 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% this week
          </p>
        )}
      </div>
    </div>
  );
}

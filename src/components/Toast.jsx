import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const borders = {
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] toast">
      <div className={`flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-xl border ${borders[toast.type] || borders.success} min-w-[260px] max-w-sm`}>
        {icons[toast.type] || icons.success}
        <span className="text-sm font-body font-medium text-gray-800">{toast.message}</span>
      </div>
    </div>
  );
}

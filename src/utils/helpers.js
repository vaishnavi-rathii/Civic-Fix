export const CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: '🕳️', color: '#f59e0b', bg: '#fef3c7' },
  { id: 'garbage', label: 'Garbage', icon: '🗑️', color: '#10b981', bg: '#d1fae5' },
  { id: 'streetlight', label: 'Streetlight', icon: '💡', color: '#6366f1', bg: '#e0e7ff' },
  { id: 'water', label: 'Water Supply', icon: '💧', color: '#0ea5e9', bg: '#e0f2fe' },
  { id: 'drainage', label: 'Drainage', icon: '🌊', color: '#8b5cf6', bg: '#ede9fe' },
  { id: 'road', label: 'Road Damage', icon: '🛣️', color: '#ef4444', bg: '#fee2e2' },
  { id: 'park', label: 'Park/Garden', icon: '🌳', color: '#22c55e', bg: '#dcfce7' },
  { id: 'other', label: 'Other', icon: '⚠️', color: '#94a3b8', bg: '#f1f5f9' },
];

export const STATUS_CONFIG = {
  'reported': { label: 'Reported', color: '#f59e0b', bg: '#fef3c7', dot: 'bg-amber-400' },
  'in-progress': { label: 'In Progress', color: '#3b82f6', bg: '#dbeafe', dot: 'bg-blue-400' },
  'resolved': { label: 'Resolved', color: '#22c55e', bg: '#dcfce7', dot: 'bg-green-400' },
  'rejected': { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', dot: 'bg-red-400' },
};

export const getCategoryInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

export const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

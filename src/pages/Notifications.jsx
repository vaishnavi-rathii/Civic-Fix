import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../utils/helpers';

export default function Notifications() {
  const { notifications, markNotifRead, markAllRead, user } = useApp();

  const mine = notifications.filter(n => !n.userId || n.userId === user?.id);
  const unread = mine.filter(n => !n.read).length;

  const typeStyles = {
    success: { bg: 'bg-green-50 border-green-100', dot: 'bg-green-500', icon: '✅' },
    info: { bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500', icon: '📌' },
    warning: { bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500', icon: '⚠️' },
    error: { bg: 'bg-red-50 border-red-100', dot: 'bg-red-500', icon: '❌' },
  };

  return (
    <div className="min-h-screen py-8 page-enter">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-extrabold text-3xl text-navy-900 flex items-center gap-3">
              Notifications
              {unread > 0 && (
                <span className="bg-flame-500 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-gray-500 font-body text-sm mt-1">Updates on your reported issues</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-display font-semibold text-gray-500 hover:text-navy-900 bg-white border-2 border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition-all">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        {mine.length === 0 ? (
          <div className="card py-20 text-center">
            <Bell size={40} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-display font-bold text-xl text-navy-900 mb-2">All caught up!</h3>
            <p className="text-gray-400 font-body text-sm">You'll be notified when your issues are updated</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map(notif => {
              const style = typeStyles[notif.type] || typeStyles.info;
              return (
                <div key={notif.id}
                  className={`relative card border p-4 transition-all hover:shadow-md cursor-pointer ${style.bg} ${!notif.read ? 'shadow-sm' : 'opacity-80'}`}
                  onClick={() => markNotifRead(notif.id)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-white shadow-sm`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body leading-relaxed ${!notif.read ? 'text-navy-900 font-medium' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                        {notif.issueId && (
                          <Link to={`/issue/${notif.issueId}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs font-display font-semibold text-flame-500 hover:underline">
                            View issue <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${style.dot}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

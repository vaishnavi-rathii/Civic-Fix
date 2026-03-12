import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const SAMPLE_ISSUES = [
  {
    id: '1',
    title: 'Large pothole on MG Road',
    description: 'A dangerous pothole near the intersection causing accidents. Multiple vehicles have been damaged.',
    category: 'pothole',
    status: 'in-progress',
    photo: null,
    location: { lat: 28.6139, lng: 77.2090, address: 'MG Road, New Delhi' },
    reportedBy: 'user1',
    reporterName: 'Arjun Sharma',
    upvotes: 24,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    comments: [{ id: 'c1', text: 'This has been here for weeks!', author: 'Priya M.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }],
    statusHistory: [
      { status: 'reported', note: 'Issue reported by citizen', date: new Date(Date.now() - 86400000 * 3).toISOString() },
      { status: 'in-progress', note: 'Assigned to PWD Department', date: new Date(Date.now() - 86400000 * 1).toISOString() },
    ],
  },
  {
    id: '2',
    title: 'Overflowing garbage bin near park',
    description: 'The garbage bin at Lodi Garden entrance hasn\'t been cleared in 5 days. Causing foul smell.',
    category: 'garbage',
    status: 'reported',
    photo: null,
    location: { lat: 28.5931, lng: 77.2197, address: 'Lodi Garden, New Delhi' },
    reportedBy: 'user2',
    reporterName: 'Meera Patel',
    upvotes: 15,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    comments: [],
    statusHistory: [
      { status: 'reported', note: 'Issue reported by citizen', date: new Date(Date.now() - 86400000 * 1).toISOString() },
    ],
  },
  {
    id: '3',
    title: 'Street light not working',
    description: '3 consecutive street lights near Connaught Place metro exit are out, making it unsafe at night.',
    category: 'streetlight',
    status: 'resolved',
    photo: null,
    location: { lat: 28.6304, lng: 77.2177, address: 'Connaught Place, New Delhi' },
    reportedBy: 'user3',
    reporterName: 'Raj Kumar',
    upvotes: 31,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    comments: [{ id: 'c2', text: 'Fixed! Lights are back on.', author: 'Raj K.', createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString() }],
    statusHistory: [
      { status: 'reported', note: 'Issue reported by citizen', date: new Date(Date.now() - 86400000 * 7).toISOString() },
      { status: 'in-progress', note: 'Electrical team dispatched', date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { status: 'resolved', note: 'All 3 lights replaced and operational', date: new Date(Date.now() - 86400000 * 0.5).toISOString() },
    ],
  },
  {
    id: '4',
    title: 'Water pipe leakage on Janpath',
    description: 'Burst water main has been flooding the road for 2 days. Significant water wastage.',
    category: 'water',
    status: 'in-progress',
    photo: null,
    location: { lat: 28.6200, lng: 77.2100, address: 'Janpath, New Delhi' },
    reportedBy: 'user2',
    reporterName: 'Meera Patel',
    upvotes: 42,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
    comments: [],
    statusHistory: [
      { status: 'reported', note: 'Issue reported by citizen', date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { status: 'in-progress', note: 'Delhi Jal Board team en route', date: new Date(Date.now() - 86400000 * 0.2).toISOString() },
    ],
  },
  {
    id: '5',
    title: 'Blocked storm drain causing flooding',
    description: 'The drain near the school is completely blocked with debris. Any rain causes flooding.',
    category: 'drainage',
    status: 'reported',
    photo: null,
    location: { lat: 28.6350, lng: 77.2250, address: 'Karol Bagh, New Delhi' },
    reportedBy: 'user1',
    reporterName: 'Arjun Sharma',
    upvotes: 19,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    comments: [],
    statusHistory: [
      { status: 'reported', note: 'Issue reported by citizen', date: new Date(Date.now() - 86400000 * 4).toISOString() },
    ],
  },
];

const SAMPLE_USERS = [
  { id: 'user1', name: 'Arjun Sharma', email: 'arjun@example.com', password: 'password', role: 'citizen', avatar: 'AS', joinedAt: '2024-01-15' },
  { id: 'user2', name: 'Meera Patel', email: 'meera@example.com', password: 'password', role: 'citizen', avatar: 'MP', joinedAt: '2024-02-20' },
  { id: 'admin', name: 'Admin User', email: 'admin@civicfix.in', password: 'admin123', role: 'admin', avatar: 'AU', joinedAt: '2023-12-01' },
];

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_user')); } catch { return null; }
  });
  const [issues, setIssues] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cf_issues'));
      return stored && stored.length > 0 ? stored : SAMPLE_ISSUES;
    } catch { return SAMPLE_ISSUES; }
  });
  const [users, setUsers] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cf_users'));
      return stored && stored.length > 0 ? stored : SAMPLE_USERS;
    } catch { return SAMPLE_USERS; }
  });
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cf_notifs')) || []; } catch { return []; }
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('cf_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('cf_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('cf_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (user) localStorage.setItem('cf_user', JSON.stringify(user));
    else localStorage.removeItem('cf_user');
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      showToast(`Welcome back, ${found.name.split(' ')[0]}! 👋`);
      return { success: true, user: found };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const register = (name, email, password) => {
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      role: 'citizen',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    showToast(`Welcome to CivicFix, ${name.split(' ')[0]}! 🎉`);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    showToast('Logged out successfully');
  };

  const reportIssue = (data) => {
    const newIssue = {
      id: `issue_${Date.now()}`,
      ...data,
      status: 'reported',
      reportedBy: user.id,
      reporterName: user.name,
      upvotes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        { status: 'reported', note: 'Issue reported by citizen', date: new Date().toISOString() },
      ],
    };
    setIssues(prev => [newIssue, ...prev]);
    addNotification({ message: `Your issue "${data.title}" has been submitted!`, issueId: newIssue.id, type: 'success' });
    showToast('Issue reported successfully! 🚨');
    return newIssue;
  };

  const updateIssueStatus = (issueId, newStatus, note = '') => {
    setIssues(prev => prev.map(issue => {
      if (issue.id !== issueId) return issue;
      const updated = {
        ...issue,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...issue.statusHistory,
          { status: newStatus, note: note || `Status updated to ${newStatus}`, date: new Date().toISOString() },
        ],
      };
      // Notify the reporter
      if (issue.reportedBy !== 'admin') {
        addNotification({
          message: `Your issue "${issue.title}" status updated to ${newStatus.replace('-', ' ')}`,
          issueId,
          type: newStatus === 'resolved' ? 'success' : 'info',
          userId: issue.reportedBy,
        });
      }
      return updated;
    }));
    showToast(`Status updated to "${newStatus.replace('-', ' ')}" ✓`);
  };

  const upvoteIssue = (issueId) => {
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? { ...issue, upvotes: issue.upvotes + 1 } : issue
    ));
  };

  const addComment = (issueId, text) => {
    const comment = {
      id: `comment_${Date.now()}`,
      text,
      author: user.name,
      createdAt: new Date().toISOString(),
    };
    setIssues(prev => prev.map(issue =>
      issue.id === issueId ? { ...issue, comments: [...issue.comments, comment] } : issue
    ));
    showToast('Comment added!');
  };

  const addNotification = (notif) => {
    setNotifications(prev => [{
      id: `notif_${Date.now()}`,
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const markNotifRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      user, login, register, logout,
      issues, reportIssue, updateIssueStatus, upvoteIssue, addComment,
      notifications, markNotifRead, markAllRead,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

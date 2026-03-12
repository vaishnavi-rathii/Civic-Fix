import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function ProtectedRoute({ children }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { user } = useApp();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f7f6f3]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Landing />} />
            <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/issue/:id" element={<IssueDetail />} />
            <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toast />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

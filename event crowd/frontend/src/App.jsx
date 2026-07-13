import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import MyTickets from './pages/MyTickets';
import AdminDashboard from './pages/AdminDashboard';
import QRScanner from './pages/QRScanner';
import Reports from './pages/Reports';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('events');

  // Handle routing redirects on authentication changes
  useEffect(() => {
    if (!loading) {
      if (!user) {
        setView('login');
      } else {
        // Redirect to their default landing page
        setView(user.role === 'admin' ? 'admin-dashboard' : 'events');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.2rem' }}>
            Syncing crowd control channels...
          </p>
        </div>
      </div>
    );
  }

  // Render view depending on state
  const renderView = () => {
    if (!user) return <Login setView={setView} />;

    switch (view) {
      // User Dashboard Views
      case 'events':
        return <UserDashboard />;
      case 'my-tickets':
        return <MyTickets />;
      
      // Admin Dashboard Views
      case 'admin-dashboard':
        return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
      case 'scanner':
        return user.role === 'admin' ? <QRScanner /> : <UserDashboard />;
      case 'reports':
        return user.role === 'admin' ? <Reports /> : <UserDashboard />;
      
      // Default
      case 'login':
        return <Login setView={setView} />;
      default:
        return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
    }
  };

  return (
    <div className="app-container">
      {user && <Navbar currentView={view} setView={setView} />}
      <main className="content-wrapper">
        {renderView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

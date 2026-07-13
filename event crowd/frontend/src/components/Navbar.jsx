import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Ticket, LayoutDashboard, QrCode, BarChart3, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = ({ currentView, setView }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setView('login');
  };

  return (
    <nav className="glass-panel" style={{ margin: '1rem 1.5rem', padding: '1rem 2rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => user ? (user.role === 'admin' ? setView('admin-dashboard') : setView('events')) : setView('login')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'var(--primary-gradient)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 65, 108, 0.3)'
          }}>
            <Calendar size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
              EVENT<span className="gradient-text">CROWD</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {user.role === 'admin' ? (
              // Admin Links
              <>
                <button 
                  onClick={() => setView('admin-dashboard')}
                  className={`btn ${currentView === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </button>
                <button 
                  onClick={() => setView('scanner')}
                  className={`btn ${currentView === 'scanner' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <QrCode size={16} />
                  QR Scanner
                </button>
                <button 
                  onClick={() => setView('reports')}
                  className={`btn ${currentView === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <BarChart3 size={16} />
                  Reports
                </button>
              </>
            ) : (
              // Regular User Links
              <>
                <button 
                  onClick={() => setView('events')}
                  className={`btn ${currentView === 'events' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Calendar size={16} />
                  Explore Events
                </button>
                <button 
                  onClick={() => setView('my-tickets')}
                  className={`btn ${currentView === 'my-tickets' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Ticket size={16} />
                  My Tickets
                </button>
              </>
            )}
          </div>
        )}

        {/* User Account / Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-light)'
              }}>
                <UserIcon size={14} className="gradient-text" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  {user.role}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '0.5rem', borderRadius: '8px' }}
              title="Logout"
            >
              <LogOut size={16} color="var(--danger)" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setView('login')}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;

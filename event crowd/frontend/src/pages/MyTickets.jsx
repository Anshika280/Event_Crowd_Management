import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TicketModal from '../components/TicketModal';
import { Ticket, Calendar, MapPin, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';

const MyTickets = () => {
  const { getAuthHeaders } = useAuth();
  
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registrations/my-registrations', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      } else {
        console.error('Failed to fetch registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title Header */}
      <div className="glass-panel" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-light)' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
          My Registered <span className="gradient-text">Tickets</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Here are your active digital passes. Present the QR code on your mobile device at the security check-in gates for scanning.
        </p>
      </div>

      {/* Ticket List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Loading digital tickets...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Ticket size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>No tickets found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          
          {registrations.map((reg) => {
            const { _id, ticketCode, checkedIn, checkInTime, event } = reg;
            if (!event) return null;

            return (
              <div 
                key={_id} 
                className="glass-panel" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: checkedIn ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-light)',
                  boxShadow: checkedIn ? '0 4px 20px rgba(16, 185, 129, 0.05)' : 'none'
                }}
              >
                
                {/* Visual Header */}
                <div style={{ 
                  height: '8px', 
                  background: checkedIn ? 'var(--success)' : 'var(--primary-gradient)' 
                }} />

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  
                  {/* Status Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {ticketCode}
                    </span>
                    {checkedIn ? (
                      <span className="badge badge-success">
                        <CheckCircle size={12} />
                        Checked In
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Clock size={12} />
                        Pending Entry
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'white', lineHeight: '1.3' }}>{event.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary-start)', fontWeight: 600, marginTop: '0.25rem' }}>
                      Attendee: {reg.attendeeName || (reg.user ? reg.user.name : '') || 'General Attendee'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      EC-{event._id.substring(event._id.length - 6).toUpperCase()}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={12} className="gradient-text" />
                      <span>{formatDate(event.date)} at {event.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={12} className="gradient-text" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '280px' }}>
                        {event.venue}
                      </span>
                    </div>
                  </div>

                  {/* Checked In Note */}
                  {checkedIn && checkInTime && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(16, 185, 129, 0.05)', 
                      padding: '0.5rem', 
                      borderRadius: '6px', 
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CheckCircle size={12} />
                      <span>Checked-in at {new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {/* Action button */}
                  <button 
                    onClick={() => {
                      // Inject user details in registration object for the modal
                      const userObj = JSON.parse(localStorage.getItem('eventCrowdUser'));
                      setSelectedTicket({ ...reg, user: userObj });
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 'auto', gap: '0.5rem', padding: '0.6rem' }}
                  >
                    <Eye size={16} />
                    View Ticket Pass
                  </button>

                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* Ticket QR Modal */}
      {selectedTicket && (
        <TicketModal
          registration={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

    </div>
  );
};

export default MyTickets;

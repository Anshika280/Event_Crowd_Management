import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import TicketModal from '../components/TicketModal';
import BookingModal from '../components/BookingModal';
import EventDetailsModal from '../components/EventDetailsModal';
import { Search, Calendar, RefreshCw } from 'lucide-react';

const UserDashboard = () => {
  const { getAuthHeaders } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  
  // Modal / Feedback state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');

  const categories = ['All', 'Tech', 'Music', 'Arts', 'Food'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events with current filters
      const eventsRes = await fetch(`/api/events?category=${category}&search=${search}`);
      const eventsData = await eventsRes.json();
      setEvents(eventsData);

      // Fetch user's registered tickets to cross-reference
      const myTicketsRes = await fetch('/api/registrations/my-registrations', {
        headers: getAuthHeaders(),
      });
      if (myTicketsRes.ok) {
        const myTicketsData = await myTicketsRes.json();
        setMyRegistrations(myTicketsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      triggerAlert('Failed to load dashboard content', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category]); // reload on category change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const triggerAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const handleRegister = (eventId) => {
    const matchedEvent = events.find(e => e._id === eventId);
    setSelectedEventForBooking(matchedEvent);
  };

  // Helper: check if user is already registered for an event
  const isRegisteredForEvent = (eventId) => {
    return myRegistrations.some((reg) => reg.event?._id === eventId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Alert Banner */}
      {alertMsg && (
        <div className={`alert-popup alert-popup-${alertType}`}>
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: '2.5rem 2rem', border: '1px solid var(--border-light)' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
          Find & Register for <span className="gradient-text">Live Events</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '600px', fontSize: '0.95rem' }}>
          Explore music festivals, tech summits, design galleries, and exclusive culinary classes. Secure your ticket, get your QR code, and join the crowd!
        </p>
      </div>

      {/* Controls & Filter Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '1rem', 
        flexWrap: 'wrap' 
      }}>
        
        {/* Category Pill Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Keyword Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '400px', minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by event title..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Search
          </button>
        </form>

      </div>

      {/* Main Grid View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <RefreshCw size={36} className="gradient-text" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Syncing with crowd databases...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3>No events found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try adjusting your search criteria or switching categories.</p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isRegistered={isRegisteredForEvent(event._id)}
              onRegister={handleRegister}
              isUser={true}
              onViewDetails={() => setSelectedEventForDetails(event)}
            />
          ))}
        </div>
      )}

      {/* Ticket QR Modal */}
      {selectedTicket && (
        <TicketModal
          registration={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Booking Modal */}
      {selectedEventForBooking && (
        <BookingModal
          event={selectedEventForBooking}
          onClose={() => setSelectedEventForBooking(null)}
          onSuccess={async (registrations) => {
            setSelectedEventForBooking(null);
            triggerAlert('Successfully booked! Your QR tickets are ready.');
            await fetchData();
            // Show the first ticket of the booking in the TicketModal
            const matchedEvent = events.find(e => e._id === selectedEventForBooking._id) || selectedEventForBooking;
            if (registrations && registrations.length > 0) {
              const fullRegistration = {
                ...registrations[0],
                event: matchedEvent,
                user: JSON.parse(localStorage.getItem('eventCrowdUser'))
              };
              setSelectedTicket(fullRegistration);
            }
          }}
          onError={(msg) => {
            triggerAlert(msg, 'error');
          }}
        />
      )}

      {/* Event Details Modal */}
      {selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          isRegistered={isRegisteredForEvent(selectedEventForDetails._id)}
          onClose={() => setSelectedEventForDetails(null)}
          onRegister={handleRegister}
          isUser={true}
        />
      )}

      {/* CSS Spin Keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default UserDashboard;

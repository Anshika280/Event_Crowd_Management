import React from 'react';
import { X, Calendar, Clock, MapPin, Users, Ticket, Sparkles } from 'lucide-react';

const EventDetailsModal = ({ event, isRegistered, onClose, onRegister, isUser }) => {
  if (!event) return null;

  const { title, description, date, time, venue, capacityLimit, registrationsCount, category, bannerUrl, price } = event;

  // Calculate percentage booked
  const percentBooked = capacityLimit > 0 
    ? Math.min(Math.round((registrationsCount / capacityLimit) * 100), 100) 
    : 0;

  // Determine capacity color class
  let capacityColorClass = 'fill-low';
  if (percentBooked >= 90) {
    capacityColorClass = 'fill-high';
  } else if (percentBooked >= 70) {
    capacityColorClass = 'fill-medium';
  }

  // Format Date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const bannerImage = bannerUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60';
  const ticketPrice = price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Free Entry';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '650px', border: '1px solid var(--border-glow)', borderRadius: '20px', overflow: 'hidden' }}
      >
        
        {/* Banner container with close button */}
        <div style={{ position: 'relative', height: '240px', width: '100%' }}>
          <img 
            src={bannerImage} 
            alt={title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'linear-gradient(to bottom, rgba(5,5,8,0.2) 0%, rgba(5,5,8,0.95) 100%)' 
          }} />
          
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              top: '1rem', 
              right: '1rem', 
              background: 'rgba(0, 0, 0, 0.5)', 
              border: 'none', 
              color: '#fff', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              zIndex: 11
            }}
          >
            <X size={20} />
          </button>

          <span 
            className="event-category-badge" 
            style={{ 
              position: 'absolute', 
              bottom: '1rem', 
              left: '1.5rem', 
              top: 'auto', 
              right: 'auto' 
            }}
          >
            {category}
          </span>
        </div>

        {/* Modal content body */}
        <div style={{ padding: '1.5rem 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title and Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{title}</h2>
            </div>
            <div style={{ 
              background: 'rgba(255, 65, 108, 0.1)', 
              border: '1px solid var(--border-glow)', 
              padding: '0.5rem 1rem', 
              borderRadius: '30px',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--primary-start)',
              whiteSpace: 'nowrap'
            }}>
              {ticketPrice}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              About the Event
            </h4>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '0.95rem', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {description}
            </p>
          </div>

          {/* Meta Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Calendar size={18} className="gradient-text" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE</span>
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>{formatDate(date)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Clock size={18} className="gradient-text" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME</span>
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>{time}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', gridColumn: '1 / -1' }}>
              <MapPin size={18} className="gradient-text" style={{ marginTop: '2px' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENUE</span>
                <span style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.4 }}>{venue}</span>
              </div>
            </div>
          </div>

          {/* Capacity Progress */}
          <div className="event-capacity-container" style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <div className="capacity-text-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={14} className="gradient-text" />
                <span style={{ fontSize: '0.85rem' }}>Available Capacity</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{registrationsCount} / {capacityLimit} Booked</span>
            </div>
            
            <div className="capacity-progress-bg" style={{ height: '8px', marginTop: '0.5rem' }}>
              <div 
                className={`capacity-progress-fill ${capacityColorClass}`} 
                style={{ width: `${percentBooked}%` }}
              />
            </div>
          </div>

          {/* Footer Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '120px' }}
            >
              Back to List
            </button>
            
            {isUser && (
              <div style={{ flex: 2, minWidth: '200px' }}>
                {isRegistered ? (
                  <button className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem' }} disabled>
                    <Ticket size={16} />
                    You are Registered
                  </button>
                ) : percentBooked >= 100 ? (
                  <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                    Sold Out
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      onClose();
                      onRegister(event._id);
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Sparkles size={16} />
                    Register for Event
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default EventDetailsModal;

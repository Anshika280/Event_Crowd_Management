import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const EventCard = ({ event, onRegister, isRegistered, isUser, onViewDetails }) => {
  const { title, description, date, time, venue, capacityLimit, registrationsCount, category, bannerUrl } = event;
  
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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fallback banner image if not provided
  const bannerImage = bannerUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60';

  return (
    <div 
      className="glass-panel event-card" 
      onClick={onViewDetails}
      style={{ cursor: onViewDetails ? 'pointer' : 'default' }}
    >
      <div className="event-banner-container">
        <img src={bannerImage} alt={title} className="event-banner" />
        <span className="event-category-badge">{category}</span>
      </div>

      <div className="event-card-content">
        <h3 className="event-card-title">{title}</h3>
        
        <p style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4'
        }}>
          {description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="event-meta-item">
            <Calendar size={14} className="gradient-text" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="event-meta-item">
            <Clock size={14} className="gradient-text" />
            <span>{time}</span>
          </div>
          <div className="event-meta-item">
            <MapPin size={14} className="gradient-text" />
            <span style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              width: '260px'
            }}>{venue}</span>
          </div>
        </div>

        <div className="event-capacity-container">
          <div className="capacity-text-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={12} />
              <span>Capacity Limit</span>
            </div>
            <span style={{ fontWeight: 600 }}>{registrationsCount} / {capacityLimit} Booked</span>
          </div>
          
          <div className="capacity-progress-bg">
            <div 
              className={`capacity-progress-fill ${capacityColorClass}`} 
              style={{ width: `${percentBooked}%` }}
            />
          </div>
        </div>

        {isUser && (
          <div style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
            {isRegistered ? (
              <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                Registered
              </button>
            ) : percentBooked >= 100 ? (
              <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                Sold Out
              </button>
            ) : (
              <button 
                onClick={() => onRegister(event._id)} 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                Register for Event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;

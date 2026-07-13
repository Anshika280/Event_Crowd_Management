import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Ticket, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookingModal = ({ event, onClose, onSuccess, onError }) => {
  const { getAuthHeaders, user } = useAuth();
  
  const [ticketCount, setTicketCount] = useState(1);
  const [attendees, setAttendees] = useState([
    { name: user?.name || '', email: user?.email || '', phone: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const price = event.price || 0;
  const isPaid = price > 0;
  
  // Calculate remaining capacity
  const remainingCapacity = event.capacityLimit - (event.registrationsCount || 0);
  const maxAvailableTickets = Math.min(5, Math.max(1, remainingCapacity));

  useEffect(() => {
    // Dynamically adjust attendee inputs size when ticket count changes
    const count = parseInt(ticketCount) || 1;
    setAttendees((prev) => {
      const updated = [...prev];
      if (updated.length < count) {
        for (let i = updated.length; i < count; i++) {
          updated.push({ name: '', email: '', phone: '' });
        }
      } else if (updated.length > count) {
        updated.splice(count);
      }
      return updated;
    });
  }, [ticketCount]);

  const handleAttendeeChange = (index, field, value) => {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Basic Validation
    for (let i = 0; i < attendees.length; i++) {
      const att = attendees[i];
      if (!att.name.trim()) {
        setErrorMsg(`Please enter name for Ticket #${i + 1}`);
        setLoading(false);
        return;
      }
      if (!att.email.trim()) {
        setErrorMsg(`Please enter email for Ticket #${i + 1}`);
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Create order or verify direct free booking
      const orderRes = await fetch('/api/registrations/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          eventId: event._id,
          numberOfTickets: ticketCount
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to initialize booking');
      }

      if (orderData.isFree) {
        // Handle free event registration
        const freeRes = await fetch('/api/registrations/register-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            eventId: event._id,
            attendees
          })
        });

        const freeData = await freeRes.json();
        if (!freeRes.ok) {
          throw new Error(freeData.message || 'Free registration failed');
        }

        onSuccess(freeData);
      } else {
        // Handle paid event with Razorpay
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error('Razorpay payment gateway failed to load. Check your internet connection.');
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Event Crowd',
          description: `Booking for ${event.title}`,
          image: event.bannerUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=100&auto=format&fit=crop&q=60',
          order_id: orderData.orderId,
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await fetch('/api/registrations/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders()
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  eventId: event._id,
                  attendees
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.message || 'Payment verification failed!');
              }

              onSuccess(verifyData);
            } catch (verErr) {
              onError(verErr.message);
              onClose();
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: attendees[0].name,
            email: attendees[0].email,
            contact: attendees[0].phone || '',
          },
          theme: {
            color: '#ff416c',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setErrorMsg(resp.error.description || 'Payment transaction failed.');
          setLoading(false);
        });
        rzp.open();
      }
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', border: '1px solid var(--border-glow)' }}>
        
        {/* Modal Close */}
        <button className="modal-close-btn" onClick={onClose} disabled={loading}>
          <X size={24} />
        </button>

        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-start)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confirm Reservation
            </span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: '#fff' }}>{event.title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Venue: {event.venue}
            </p>
          </div>

          {errorMsg && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              marginBottom: '1.25rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Quantity Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600 }}>Number of Tickets</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Max 5 tickets per reservation ({remainingCapacity} left)
                </span>
              </div>
              <select
                className="form-control"
                value={ticketCount}
                onChange={(e) => setTicketCount(parseInt(e.target.value))}
                style={{ width: '80px', padding: '0.4rem 0.6rem', textAlign: 'center' }}
                disabled={loading}
              >
                {Array.from({ length: maxAvailableTickets }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num} style={{ background: 'var(--bg-secondary)', color: 'white' }}>{num}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Attendee Details Forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {attendees.map((attendee, index) => (
                <div 
                  key={index} 
                  style={{ 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    background: 'rgba(255,255,255,0.01)', 
                    padding: '1rem', 
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                    <Ticket size={14} className="gradient-text" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Ticket #{index + 1} Attendee details
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="form-control"
                        value={attendee.name}
                        onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                        style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', paddingRight: '0.5rem' }}
                        required
                        disabled={loading}
                      />
                      <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="form-control"
                        value={attendee.email}
                        onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                        style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', paddingRight: '0.5rem' }}
                        required
                        disabled={loading}
                      />
                      <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        placeholder="Phone Number (Optional)"
                        className="form-control"
                        value={attendee.phone}
                        onChange={(e) => handleAttendeeChange(index, 'phone', e.target.value)}
                        style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', paddingRight: '0.5rem' }}
                        disabled={loading}
                      />
                      <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Ticket Price ({isPaid ? `Paid` : 'Free'})</span>
                <span>{isPaid ? `₹${price.toLocaleString('en-IN')}` : '₹0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Quantity Selected</span>
                <span>x {ticketCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span className="gradient-text">Total Price</span>
                <span>{isPaid ? `₹${(price * ticketCount).toLocaleString('en-IN')}` : '₹0'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ flex: 1 }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, gap: '0.5rem' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite' }} />
                    Processing...
                  </>
                ) : isPaid ? (
                  <>
                    <ShieldCheck size={16} />
                    Pay with Razorpay
                  </>
                ) : (
                  <>
                    Book Free Pass
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>

      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BookingModal;

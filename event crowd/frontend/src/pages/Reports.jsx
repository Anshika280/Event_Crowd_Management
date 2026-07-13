import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Download, RefreshCw, BarChart, PieChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const { getAuthHeaders } = useAuth();
  
  const [eventsData, setEventsData] = useState([]);
  const [timelineData, setTimelineData] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch event capacity details
      const liveRes = await fetch('/api/analytics/live-status', {
        headers: getAuthHeaders(),
      });
      if (liveRes.ok) {
        const live = await liveRes.json();
        setEventsData(live.events || []);
      }

      // 2. Fetch timeline distribution data
      const timelineRes = await fetch('/api/analytics/attendance-report', {
        headers: getAuthHeaders(),
      });
      if (timelineRes.ok) {
        const timeline = await timelineRes.json();
        setTimelineData(timeline.hourlyCheckIns || { labels: [], data: [] });
      }
    } catch (e) {
      console.error('Error fetching report analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // Generate and trigger browser CSV download
  const handleDownloadCSV = () => {
    if (eventsData.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    // Column Headers
    csvContent += 'Event ID,Event Title,Capacity Limit,Tickets Booked,Checked-In Count,Occupancy Rate (%)\n';
    
    // Rows
    eventsData.forEach(evt => {
      const row = [
        `"${evt.eventId}"`,
        `"${evt.title.replace(/"/g, '""')}"`,
        evt.capacityLimit,
        evt.registrationsCount,
        evt.currentCount,
        evt.occupancyRate
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `event_crowd_occupancy_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Setup Data for Capacity Comparison (Bar Chart)
  const barChartData = {
    labels: eventsData.map(e => e.title.substring(0, 18) + (e.title.length > 18 ? '...' : '')),
    datasets: [
      {
        label: 'Tickets Booked',
        data: eventsData.map(e => e.registrationsCount),
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
      },
      {
        label: 'Checked-In Attendees',
        data: eventsData.map(e => e.currentCount),
        backgroundColor: 'rgba(255, 65, 108, 0.85)',
        borderColor: 'var(--primary-start)',
        borderWidth: 1,
      }
    ],
  };

  // 2. Setup Data for Check-in distribution over time (Timeline Bar Chart)
  const timelineChartData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Checked-In Gate Entrants',
        data: timelineData.data,
        backgroundColor: 'rgba(255, 75, 43, 0.85)',
        borderColor: 'var(--primary-end)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // 3. Setup Data for Total Attendee Distribution (Doughnut Chart)
  const totalBookings = eventsData.reduce((acc, curr) => acc + curr.registrationsCount, 0);
  const totalCheckedIn = eventsData.reduce((acc, curr) => acc + curr.currentCount, 0);
  const totalPending = Math.max(totalBookings - totalCheckedIn, 0);

  const doughnutChartData = {
    labels: ['Checked In', 'Pending Gate'],
    datasets: [
      {
        data: [totalCheckedIn, totalPending],
        backgroundColor: ['#10b981', 'rgba(255, 255, 255, 0.05)'],
        borderColor: ['#047857', 'rgba(255, 255, 255, 0.1)'],
        borderWidth: 1,
      }
    ]
  };

  // Chart Global styling overrides (forces dark mode colors)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0',
          font: { family: 'Inter', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 25, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 65, 108, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, precision: 0 }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>
            Gate Attendance <span className="gradient-text">Reports</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Analyze check-in distributions, compare ticket registrations, and generate crowd compliance logs.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchReportsData} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={handleDownloadCSV} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={eventsData.length === 0}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Aggregating analytics...</p>
        </div>
      ) : eventsData.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h3>No records found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Create events and register users to compute charts.</p>
        </div>
      ) : (
        /* Report Layout Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Column: Main Charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Live Occupancy vs Capacity */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart size={16} className="gradient-text" />
                Event capacity & check-in comparison
              </h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            {/* Check-in Times Distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart size={16} className="gradient-text" />
                Hourly Gate Entry Distribution
              </h3>
              <div style={{ height: '240px', position: 'relative' }}>
                <Bar data={timelineChartData} options={chartOptions} />
              </div>
            </div>

          </div>

          {/* Right Column: Key Metrics & Doughnut */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Overall check-in stats doughnut */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={16} className="gradient-text" />
                Global Entry Status
              </h3>
              <div style={{ height: '180px', position: 'relative', marginBottom: '1.5rem' }}>
                <Doughnut 
                  data={doughnutChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: '#e2e8f0', font: { family: 'Inter', size: 10 } } }
                    }
                  }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Issued Tickets:</span>
                  <span style={{ fontWeight: 700, color: 'white' }}>{totalBookings}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Checked-In:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{totalCheckedIn}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Checked-In Rate:</span>
                  <span style={{ fontWeight: 700, color: 'white' }}>
                    {totalBookings > 0 ? Math.round((totalCheckedIn / totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Stats Info */}
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255, 65, 108, 0.02)', border: '1px dashed var(--border-glow)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary-start)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Crowd Safety Tip
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                The live monitoring dashboard flashes alert colors when occupancy reaches 90%. Set capacity limits carefully depending on venue floor spacing.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* CSS Table column layout fix for smaller displays */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Reports;

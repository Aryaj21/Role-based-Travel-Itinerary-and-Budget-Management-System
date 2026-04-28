import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/trips/my')
      .then(res => setMyTrips(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = myTrips.length;
  const ongoing = myTrips.filter(t => t.status === 'ongoing').length;
  const completed = myTrips.filter(t => t.status === 'completed').length;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const getDashboardLabel = () => {
    if (isAdmin) return "Here's an overview of trips you've created.";
    if (isManager) return "Here are the trips you're managing.";
    return "Here are the trips you've joined.";
  };

  const getTripsLabel = () => {
    if (isAdmin) return 'Created Trips';
    if (isManager) return 'Managed Trips';
    return 'Joined Trips';
  };

  const getSectionTitle = () => {
    if (isAdmin) return 'My Created Trips';
    if (isManager) return 'Trips I Manage';
    return 'My Joined Trips';
  };

  const getEmptyMsg = () => {
    if (isAdmin) return 'No trips created yet. Go to the Admin Panel to create trips.';
    if (isManager) return 'No trips assigned to you yet.';
    return "You haven't joined any trips yet. Browse trips to get started!";
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1 className="page-title">Welcome, {user?.name}</h1>
        <p className="page-subtitle">{getDashboardLabel()}</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{getTripsLabel()}</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ongoing</div>
            <div className="stat-value">{ongoing}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{completed}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            {getSectionTitle()}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isAdmin && (
              <button className="btn-add" onClick={() => navigate('/trips')}>
                Browse All Trips
              </button>
            )}
            {isAdmin && (
              <button className="btn-add" onClick={() => navigate('/admin')}>
                + Manage in Admin Panel
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="empty-msg">Loading...</p>
        ) : myTrips.length === 0 ? (
          <p className="empty-msg">{getEmptyMsg()}</p>
        ) : (
          <div className="trips-grid">
            {myTrips.map(trip => (
              <div
                key={trip._id}
                className="trip-card"
                onClick={() => navigate(`/trips/${trip._id}`)}
              >
                <h3>{trip.title}</h3>
                <div className="trip-meta">📍 {trip.destination}</div>
                <div className="trip-meta">
                  <span className="trip-rating">★ {trip.rating || 'N/A'}</span>
                </div>
                <div className="trip-meta">🗓 {trip.duration} days</div>
                {trip.startDate && (
                  <div className="trip-meta">
                    📅 {formatDate(trip.startDate)}{trip.endDate ? ` → ${formatDate(trip.endDate)}` : ''}
                  </div>
                )}
                {isAdmin && trip.assignedManagers?.length > 0 && (
                  <div className="trip-meta" style={{ fontSize: '12px', color: '#aaa' }}>
                    🧑‍💼 {trip.assignedManagers.map(m => m.name || m).join(', ')}
                  </div>
                )}
                {isManager && (
                  <div className="trip-meta" style={{ fontSize: '12px', color: '#aaa' }}>
                    👥 {trip.travelers?.length || 0} traveler(s)
                  </div>
                )}
                <div className="trip-price">₹{trip.budget?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;

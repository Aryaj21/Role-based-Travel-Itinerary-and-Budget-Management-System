import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const BrowseTrips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());

  const fetchTrips = (q = '') => {
    setLoading(true);
    axios.get(`/api/trips${q ? `?search=${q}` : ''}`)
      .then(res => setTrips(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchMyTrips = () => {
    if (user?.role === 'traveler' || user?.role === 'manager') {
      axios.get('/api/trips/my')
        .then(res => {
          const ids = new Set(res.data.map(t => t._id));
          setJoinedIds(ids);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchMyTrips();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchTrips(q);
  };

  const handleJoin = async (e, tripId) => {
    e.stopPropagation();
    setJoiningId(tripId);
    try {
      await axios.post(`/api/trips/${tripId}/join`);
      setJoinedIds(prev => new Set([...prev, tripId]));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join trip');
    }
    setJoiningId(null);
  };

  const handleLeave = async (e, tripId) => {
    e.stopPropagation();
    if (!window.confirm('Leave this trip?')) return;
    setJoiningId(tripId);
    try {
      await axios.post(`/api/trips/${tripId}/leave`);
      setJoinedIds(prev => {
        const next = new Set(prev);
        next.delete(tripId);
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave trip');
    }
    setJoiningId(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="browse-header">
          <h1 className="page-title">Browse Trips</h1>
          <p className="page-subtitle" style={{ color: '#aaa', marginTop: '4px' }}>
            {isAdmin
              ? 'All trips in the system.'
              : 'Explore all available trips and join the ones you like!'}
          </p>
        </div>

        {/* Search bar — only here */}
        <div style={{ marginBottom: '24px' }}>
          <input
            className="form-input"
            type="text"
            placeholder="🔍 Search by trip name or destination..."
            value={search}
            onChange={handleSearch}
            style={{ maxWidth: '420px', width: '100%' }}
          />
        </div>

        {loading ? (
          <p className="empty-msg">Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className="empty-msg">No trips found.</p>
        ) : (
          <div className="trips-grid">
            {trips.map(trip => {
              const hasJoined = joinedIds.has(trip._id);
              return (
                <div
                  key={trip._id}
                  className="trip-card"
                  onClick={() => navigate(`/trips/${trip._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{trip.title}</h3>
                  <div className="trip-meta">📍 {trip.destination}</div>
                  <div className="trip-meta trip-rating">★ {trip.rating || 'N/A'} / 5</div>
                  <div className="trip-meta">🗓 {trip.duration} days</div>
                  {trip.startDate && (
                    <div className="trip-meta">📅 {formatDate(trip.startDate)} → {trip.endDate ? formatDate(trip.endDate) : 'TBD'}</div>
                  )}
                  <div className="trip-meta">👥 {trip.travelers?.length || 0} traveler(s)</div>
                  {isAdmin && (
                    <div className="trip-meta" style={{ fontSize: '12px', color: '#aaa' }}>
                      🧑‍💼 {trip.assignedManagers?.length > 0
                        ? trip.assignedManagers.map(m => m.name).join(', ')
                        : 'No manager assigned'}
                    </div>
                  )}
                  <div className="trip-price">₹{trip.budget?.toLocaleString()}</div>

                  {!isAdmin && (
                    <div style={{ marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                      {hasJoined ? (
                        <button
                          className="btn-danger"
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                          disabled={joiningId === trip._id}
                          onClick={(e) => handleLeave(e, trip._id)}
                        >
                          {joiningId === trip._id ? 'Leaving...' : '✓ Joined — Leave'}
                        </button>
                      ) : (
                        <button
                          className="btn-add"
                          style={{ width: '100%', padding: '6px', fontSize: '13px' }}
                          disabled={joiningId === trip._id}
                          onClick={(e) => handleJoin(e, trip._id)}
                        >
                          {joiningId === trip._id ? 'Joining...' : '+ Join Trip'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default BrowseTrips;

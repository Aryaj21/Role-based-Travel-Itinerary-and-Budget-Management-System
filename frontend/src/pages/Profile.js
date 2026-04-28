import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

/* ── Destination → emoji flag / landmark map ── */
const DEST_EMOJI = {
  goa: '🏖️', manali: '🏔️', coorg: '🌿', jaipur: '🏯',
  kerala: '🌴', ladakh: '⛰️', andaman: '🐠', mumbai: '🌆',
  delhi: '🕌', bangalore: '🏙️', ooty: '🍃', mysore: '👑',
};
const destEmoji = (dest = '') => DEST_EMOJI[dest.toLowerCase().split(',')[0].trim()] || '✈️';

/* ════════════════════════════════════════════
   PROFILE COMPONENT
════════════════════════════════════════════ */
const Profile = () => {
  const { user } = useAuth();
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/trips/my')
      .then(res => setMyTrips(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';
  const completedTrips = myTrips.filter(t => t.status === 'completed');
  const totalSpent    = myTrips.reduce((s, t) => s + (t.budget || 0), 0);
  const destinations  = [...new Set(myTrips.map(t => t.destination))];



  return (
    <>
      <Navbar />
      <div className="page">

        {/* ── Profile Header ── */}
        <div className="profile-header">
          <div className="avatar-circle" style={{ fontSize: '2rem', width: 72, height: 72 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-role" style={{ textTransform: 'capitalize' }}>
            {isAdmin ? '🛡️ Admin' : '✈️ Traveler'} · {user?.email}
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="number">{myTrips.length}</div>
              <div className="label">{isAdmin ? 'Trips Created' : 'Trips'}</div>
            </div>
            <div className="profile-stat">
              <div className="number">{destinations.length}</div>
              <div className="label">Destinations</div>
            </div>
            <div className="profile-stat">
              <div className="number">₹{(totalSpent / 1000).toFixed(0)}k</div>
              <div className="label">Total Budget</div>
            </div>
            <div className="profile-stat">
              <div className="number">{completedTrips.length}</div>
              <div className="label">Completed</div>
            </div>
          </div>
        </div>

        {loading && <p className="empty-msg">Loading...</p>}
      </div>
    </>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const EMPTY_TRIP = {
  title: '', destination: '', description: '',
  startDate: '', endDate: '',
  duration: '', budget: '', status: 'upcoming', assignedManagers: [],
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Create trip form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTrip, setNewTrip] = useState(EMPTY_TRIP);
  const [creating, setCreating] = useState(false);

  // Assign managers modal
  const [assignModal, setAssignModal] = useState(null); // trip object
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/users'),
      axios.get('/api/admin/trips'),
    ]).then(([usersRes, tripsRes]) => {
      setUsers(usersRes.data);
      setTrips(tripsRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch { alert('Failed to delete user'); }
  };

  const deleteTrip = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await axios.delete(`/api/trips/${id}`);
      setTrips(trips.filter(t => t._id !== id));
    } catch { alert('Failed to delete trip'); }
  };

  const seedTrips = async () => {
    try {
      await axios.post('/api/admin/seed');
      const res = await axios.get('/api/admin/trips');
      setTrips(res.data);
      alert('Sample trips seeded!');
    } catch { alert('Seed failed'); }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post('/api/admin/trips', {
        ...newTrip,
        duration: Number(newTrip.duration) || 0,
        budget: Number(newTrip.budget) || 0,
        startDate: newTrip.startDate || null,
        endDate: newTrip.endDate || null,
      });
      setTrips([res.data, ...trips]);
      setNewTrip(EMPTY_TRIP);
      setShowCreateForm(false);
    } catch { alert('Failed to create trip'); }
    setCreating(false);
  };

  const openAssignModal = (trip) => {
    setAssignModal(trip);
    setSelectedManagers(trip.assignedManagers?.map(m => m._id) || []);
  };

  const toggleManager = (userId) => {
    setSelectedManagers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAssignManagers = async () => {
    setAssigning(true);
    try {
      const res = await axios.put(`/api/admin/trips/${assignModal._id}/assign-managers`, {
        managerIds: selectedManagers,
      });
      setTrips(trips.map(t => t._id === assignModal._id ? res.data : t));
      setAssignModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign managers');
    }
    setAssigning(false);
  };

  // Promote/demote user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? res.data : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const managers = users.filter(u => u.role === 'manager');
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <>
      <Navbar />
      <div className="page">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users, managers, and trips</p>

        <div className="profile-tabs" style={{ marginBottom: '24px' }}>
          <div className={`profile-tab${activeTab === 'users' ? ' active' : ''}`} onClick={() => setActiveTab('users')}>
            Users ({users.length})
          </div>
          <div className={`profile-tab${activeTab === 'trips' ? ' active' : ''}`} onClick={() => setActiveTab('trips')}>
            Trips ({trips.length})
          </div>
        </div>

        {loading ? <p className="empty-msg">Loading...</p> : (
          <>
            {/* ── USERS TAB ── */}
            {activeTab === 'users' && (
              <>
                <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '12px' }}>
                  Tip: Promote travelers to <strong>Manager</strong> so you can assign them to trips.
                </p>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge badge-${u.role}`}>{u.role}</span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Only allow role toggle for non-admin users */}
                          {u.role !== 'admin' && (
                            u.role === 'manager' ? (
                              <button
                                className="btn-add"
                                style={{ padding: '4px 10px', fontSize: '12px', background: '#6c757d' }}
                                onClick={() => handleRoleChange(u._id, 'traveler')}
                              >
                                Demote to Traveler
                              </button>
                            ) : (
                              <button
                                className="btn-add"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => handleRoleChange(u._id, 'manager')}
                              >
                                Make Manager
                              </button>
                            )
                          )}
                          <button className="btn-danger" onClick={() => deleteUser(u._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* ── TRIPS TAB ── */}
            {activeTab === 'trips' && (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="btn-add" onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? '✕ Cancel' : '+ Create Trip'}
                  </button>
                  <button className="btn-add" onClick={seedTrips} style={{ background: '#6c757d' }}>
                    Seed Sample Trips
                  </button>
                </div>

                {/* Create Trip Form */}
                {showCreateForm && (
                  <div className="create-trip-form" style={{
                    background: 'var(--card-bg, #1e1e2e)',
                    border: '1px solid var(--border, #333)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                  }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>Create New Trip</h3>
                    <form onSubmit={handleCreateTrip}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Trip Title *</label>
                          <input
                            className="form-input"
                            required
                            placeholder="e.g. Goa Beach Vacation"
                            value={newTrip.title}
                            onChange={e => setNewTrip({ ...newTrip, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Destination *</label>
                          <input
                            className="form-input"
                            required
                            placeholder="e.g. Goa, India"
                            value={newTrip.destination}
                            onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Start Date</label>
                          <input
                            className="form-input"
                            type="date"
                            value={newTrip.startDate}
                            onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>End Date</label>
                          <input
                            className="form-input"
                            type="date"
                            min={newTrip.startDate || ''}
                            value={newTrip.endDate}
                            onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Duration (days)</label>
                          <input
                            className="form-input"
                            type="number" min="1"
                            placeholder="e.g. 5"
                            value={newTrip.duration}
                            onChange={e => setNewTrip({ ...newTrip, duration: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Budget (₹)</label>
                          <input
                            className="form-input"
                            type="number" min="0"
                            placeholder="e.g. 15000"
                            value={newTrip.budget}
                            onChange={e => setNewTrip({ ...newTrip, budget: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Status</label>
                          <select
                            className="form-input"
                            value={newTrip.status}
                            onChange={e => setNewTrip({ ...newTrip, status: e.target.value })}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>Description</label>
                          <textarea
                            className="form-input"
                            rows="2"
                            placeholder="Brief description of the trip"
                            value={newTrip.description}
                            onChange={e => setNewTrip({ ...newTrip, description: e.target.value })}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        {/* Assign managers at creation time */}
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary, #aaa)' }}>
                            Assign Managers (optional)
                          </label>
                          {managers.length === 0 ? (
                            <p style={{ color: '#888', fontSize: '13px' }}>
                              No managers available. Go to the Users tab and promote users to Manager first.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {managers.map(m => (
                                <label key={m._id} style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '6px 12px',
                                  background: newTrip.assignedManagers.includes(m._id) ? 'var(--accent, #7c3aed)' : 'var(--surface, #2a2a3e)',
                                  borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
                                  color: 'var(--text-primary, #fff)',
                                  border: '1px solid var(--border, #444)',
                                  transition: 'all 0.2s',
                                }}>
                                  <input
                                    type="checkbox"
                                    style={{ display: 'none' }}
                                    checked={newTrip.assignedManagers.includes(m._id)}
                                    onChange={() => {
                                      const list = newTrip.assignedManagers.includes(m._id)
                                        ? newTrip.assignedManagers.filter(id => id !== m._id)
                                        : [...newTrip.assignedManagers, m._id];
                                      setNewTrip({ ...newTrip, assignedManagers: list });
                                    }}
                                  />
                                  🧑‍💼 {m.name}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-add" disabled={creating}>
                          {creating ? 'Creating...' : 'Create Trip'}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => { setShowCreateForm(false); setNewTrip(EMPTY_TRIP); }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Trips Table */}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th><th>Destination</th><th>Dates</th><th>Budget</th>
                      <th>Status</th><th>Travelers</th><th>Managers</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t._id}>
                        <td>{t.title}</td>
                        <td>{t.destination}</td>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {t.startDate ? (
                            <>{formatDate(t.startDate)}<br /><span style={{ color: '#888' }}>→ {t.endDate ? formatDate(t.endDate) : 'TBD'}</span></>
                          ) : <span style={{ color: '#888' }}>—</span>}
                        </td>
                        <td>₹{t.budget?.toLocaleString()}</td>
                        <td><span className="badge badge-traveler">{t.status}</span></td>
                        <td style={{ fontSize: '12px' }}>
                          {t.travelers?.length > 0
                            ? <span title={t.travelers.map(tr => tr.name || tr.email || 'Unknown').join(', ')}>
                                {t.travelers.length} ({t.travelers.map(tr => tr.name || 'Unknown').join(', ')})
                              </span>
                            : <span style={{ color: '#888' }}>None</span>}
                        </td>
                        <td>
                          {t.assignedManagers?.length > 0
                            ? t.assignedManagers.map(m => m.name).join(', ')
                            : <span style={{ color: '#888', fontSize: '12px' }}>None</span>}
                        </td>
                        <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-add"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => openAssignModal(t)}
                          >
                            Assign Managers
                          </button>
                          <button className="btn-danger" onClick={() => deleteTrip(t._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>

      {/* Assign Managers Modal */}
      {assignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--card-bg, #1e1e2e)',
            border: '1px solid var(--border, #333)',
            borderRadius: '16px', padding: '28px',
            width: '440px', maxWidth: '95vw',
          }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
              Assign Managers
            </h3>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              Trip: <strong style={{ color: 'var(--text-primary,#fff)' }}>{assignModal.title}</strong>
            </p>

            {managers.length === 0 ? (
              <div style={{ color: '#888', fontSize: '13px' }}>
                <p>No managers found.</p>
                <p style={{ marginTop: '8px' }}>Go to the <strong style={{ color: '#fff' }}>Users</strong> tab and promote a user to Manager first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {managers.map(m => (
                  <label key={m._id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px',
                    background: selectedManagers.includes(m._id) ? 'rgba(124,58,237,0.2)' : 'var(--surface, #2a2a3e)',
                    borderRadius: '8px', cursor: 'pointer',
                    border: selectedManagers.includes(m._id) ? '1px solid var(--accent, #7c3aed)' : '1px solid var(--border, #444)',
                    transition: 'all 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedManagers.includes(m._id)}
                      onChange={() => toggleManager(m._id)}
                      style={{ width: '16px', height: '16px', accentColor: '#7c3aed' }}
                    />
                    <div>
                      <div style={{ color: 'var(--text-primary,#fff)', fontWeight: 500 }}>🧑‍💼 {m.name}</div>
                      <div style={{ color: '#888', fontSize: '12px' }}>{m.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-add" onClick={handleAssignManagers} disabled={assigning}>
                {assigning ? 'Saving...' : 'Save Assignment'}
              </button>
              <button className="btn-danger" onClick={() => setAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;

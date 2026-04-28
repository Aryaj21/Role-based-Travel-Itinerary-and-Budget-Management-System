import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Convert ISO date to yyyy-mm-dd for date input value
const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

const TripDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [itForm, setItForm] = useState({ day: '', title: '', description: '', location: '', time: '' });
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '', description: '' });

  useEffect(() => {
    axios.get(`/api/trips/${id}`)
      .then(res => setTrip(res.data))
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await axios.delete(`/api/trips/${id}`);
      navigate('/trips');
    } catch (err) {
      alert('Failed to delete trip');
    }
  };

  const handleAddItinerary = async (e) => {
    e.preventDefault();
    try {
      const updated = { ...trip, itinerary: [...(trip.itinerary || []), { ...itForm, day: Number(itForm.day) }] };
      const res = await axios.put(`/api/trips/${id}`, updated);
      setTrip(res.data);
      setShowAddItinerary(false);
      setItForm({ day: '', title: '', description: '', location: '', time: '' });
    } catch (err) {
      alert('Failed to add itinerary item');
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      const updated = { ...trip, budgetItems: [...(trip.budgetItems || []), { ...budgetForm, amount: Number(budgetForm.amount) }] };
      const res = await axios.put(`/api/trips/${id}`, updated);
      setTrip(res.data);
      setShowAddBudget(false);
      setBudgetForm({ category: '', amount: '', description: '' });
    } catch (err) {
      alert('Failed to add budget item');
    }
  };

  const isAdmin = user?.role === 'admin';
  const totalBudget = trip?.budgetItems?.reduce((sum, b) => sum + b.amount, 0) || 0;

  if (loading) return <><Navbar /><div className="page"><p>Loading...</p></div></>;
  if (!trip) return null;

  return (
    <>
      <Navbar />
      <div className="trip-detail">
        <div className="trip-detail-header">
          <h1>{trip.title}</h1>
          <div className="trip-detail-meta">
            <span className="meta-badge">📍 {trip.destination}</span>
            <span className="meta-badge">🗓 {trip.duration} days</span>
            {trip.startDate && (
              <span className="meta-badge">📅 {formatDate(trip.startDate)} → {trip.endDate ? formatDate(trip.endDate) : 'TBD'}</span>
            )}
            <span className="meta-badge">★ {trip.rating || 'N/A'} / 5</span>
            <span className="meta-badge">👥 {trip.travelers?.length || 0} travelers</span>
            <span className="meta-badge">₹{trip.budget?.toLocaleString()}</span>
            {trip.status && <span className="meta-badge" style={{ textTransform: 'capitalize' }}>🔖 {trip.status}</span>}
          </div>
          {trip.description && <p style={{ color: '#555', marginBottom: '16px' }}>{trip.description}</p>}

          {isAdmin && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-add" onClick={() => setShowEditModal(true)}>Edit Trip</button>
              <button className="btn-danger" style={{ padding: '10px 18px', borderRadius: '6px', fontSize: '0.9rem' }} onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>

        <div className="profile-tabs">
          {['itinerary', 'budget', 'assigned'].map(tab => (
            <div
              key={tab}
              className={`profile-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'assigned' ? 'Travelers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        {activeTab === 'itinerary' && (
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Itinerary</h3>
              {isAdmin && (
                <button className="btn-add" onClick={() => setShowAddItinerary(true)}>+ Add Day</button>
              )}
            </div>
            {!trip.itinerary?.length ? (
              <p className="empty-msg">No itinerary added yet.</p>
            ) : (
              [...trip.itinerary].sort((a, b) => a.day - b.day).map((item, i) => (
                <div key={i} className="itinerary-item">
                  <div className="itinerary-day">Day {item.day} {item.time && `• ${item.time}`}</div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                  {item.location && <div className="trip-meta">📍 {item.location}</div>}
                  {item.description && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>{item.description}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Budget Breakdown</h3>
              {isAdmin && (
                <button className="btn-add" onClick={() => setShowAddBudget(true)}>+ Add Expense</button>
              )}
            </div>
            {!trip.budgetItems?.length ? (
              <p className="empty-msg">No budget items added yet.</p>
            ) : (
              <>
                {trip.budgetItems.map((item, i) => (
                  <div key={i} className="budget-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.category}</div>
                      {item.description && <div style={{ color: '#888', fontSize: '0.85rem' }}>{item.description}</div>}
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString()}</div>
                  </div>
                ))}
                <div className="budget-item" style={{ fontWeight: 700, fontSize: '1rem' }}>
                  <div>Total Spent</div>
                  <div>₹{totalBudget.toLocaleString()}</div>
                </div>
                <div className="budget-item" style={{ color: totalBudget > trip.budget ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
                  <div>Trip Budget</div>
                  <div>₹{trip.budget?.toLocaleString()}</div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'assigned' && (
          <div className="section-card">
            <h3>Travelers ({trip.travelers?.length || 0})</h3>
            {!trip.travelers?.length ? (
              <p className="empty-msg">No travelers have joined yet.</p>
            ) : (
              trip.travelers.map((t, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar-circle" style={{ width: 40, height: 40, fontSize: '1rem', background: '#e8f0fe', color: '#1e6fbf' }}>
                    {(t.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t.name || 'Unknown'}</div>
                    {t.email && <div style={{ fontSize: '12px', color: '#888' }}>{t.email}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTripModal trip={trip} onClose={() => setShowEditModal(false)} onSave={(updated) => { setTrip(updated); setShowEditModal(false); }} />
      )}

      {showAddItinerary && (
        <div className="modal-overlay" onClick={() => setShowAddItinerary(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Itinerary Day</h2>
            <form onSubmit={handleAddItinerary}>
              <div className="form-row">
                <div className="form-group">
                  <label>Day #</label>
                  <input type="number" value={itForm.day} onChange={e => setItForm({ ...itForm, day: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input type="text" placeholder="e.g. 9:00 AM" value={itForm.time} onChange={e => setItForm({ ...itForm, time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={itForm.title} onChange={e => setItForm({ ...itForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={itForm.location} onChange={e => setItForm({ ...itForm, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={itForm.description} onChange={e => setItForm({ ...itForm, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddItinerary(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBudget && (
        <div className="modal-overlay" onClick={() => setShowAddBudget(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Budget Item</h2>
            <form onSubmit={handleAddBudget}>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input type="text" placeholder="e.g. Hotel" value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={budgetForm.description} onChange={e => setBudgetForm({ ...budgetForm, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddBudget(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const EditTripModal = ({ trip, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: trip.title,
    destination: trip.destination,
    description: trip.description || '',
    duration: trip.duration || '',
    budget: trip.budget || '',
    status: trip.status || 'upcoming',
    startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
    endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/trips/${trip._id}`, {
        ...form,
        duration: Number(form.duration),
        budget: Number(form.budget),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      onSave(res.data);
    } catch (err) {
      alert('Failed to update trip');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit Trip</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Destination</label>
            <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} min={form.startDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Duration (days)</label>
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Budget (₹)</label>
              <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TripDetail;

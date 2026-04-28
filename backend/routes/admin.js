const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trip = require('../models/Trip');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Promote user to manager (admin only)
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['traveler', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be traveler or manager.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all trips (admin only)
router.get('/trips', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('createdBy', 'name email')
      .populate('travelers', 'name email')
      .populate('assignedManagers', 'name email role');
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create trip (admin only)
router.post('/trips', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { assignedManagers, ...tripData } = req.body;
    const trip = new Trip({
      ...tripData,
      createdBy: req.user.id,
      assignedManagers: assignedManagers || [],
    });
    await trip.save();
    const populated = await Trip.findById(trip._id)
      .populate('createdBy', 'name email')
      .populate('travelers', 'name email')
      .populate('assignedManagers', 'name email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign managers to a trip (admin only)
router.put('/trips/:id/assign-managers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { managerIds } = req.body; // array of manager user IDs
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Validate that all provided IDs are managers
    const managers = await User.find({ _id: { $in: managerIds }, role: 'manager' });
    if (managers.length !== managerIds.length) {
      return res.status(400).json({ message: 'One or more selected users are not managers' });
    }

    trip.assignedManagers = managerIds;
    await trip.save();

    const populated = await Trip.findById(trip._id)
      .populate('createdBy', 'name email')
      .populate('travelers', 'name email')
      .populate('assignedManagers', 'name email role');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed sample trips (admin)
router.post('/seed', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sampleTrips = [
      { title: 'Goa Beach Vacation', destination: 'Goa', description: 'Enjoy the beaches', duration: 7, budget: 12000, rating: 3.9, isPublic: true, createdBy: req.user.id },
      { title: 'Manali Snow Adventure', destination: 'Manali', description: 'Snow and adventure', duration: 4, budget: 15000, rating: 4.1, isPublic: true, createdBy: req.user.id },
      { title: 'Coorg Nature Escape', destination: 'Coorg', description: 'Coffee estates and nature', duration: 3, budget: 8000, rating: 4.6, isPublic: true, createdBy: req.user.id },
      { title: 'Jaipur Heritage Tour', destination: 'Jaipur', description: 'Royal Rajasthan', duration: 3, budget: 10000, rating: 4.9, isPublic: true, createdBy: req.user.id },
      { title: 'Kerala Backwater Tour', destination: 'Kerala', description: 'Backwaters and houseboats', duration: 7, budget: 9000, rating: 4.7, isPublic: true, createdBy: req.user.id },
      { title: 'Ladakh Adventure', destination: 'Ladakh', description: 'High altitude adventure', duration: 7, budget: 20000, rating: 5.0, isPublic: true, createdBy: req.user.id },
      { title: 'Andaman Island Escape', destination: 'Andaman', description: 'Island and beaches', duration: 3, budget: 18000, rating: 4.1, isPublic: true, createdBy: req.user.id },
    ];
    await Trip.insertMany(sampleTrips);
    res.json({ message: 'Sample trips seeded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authMiddleware } = require('../middleware/auth');

// GET all public trips — all authenticated users can browse all trips
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isPublic: true };

    if (search) {
      query.$and = [
        { isPublic: true },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { destination: { $regex: search, $options: 'i' } },
          ]
        }
      ];
      delete query.isPublic;
    }

    const trips = await Trip.find(query)
      .populate('createdBy', 'name')
      .populate('travelers', 'name email')
      .populate('assignedManagers', 'name email role');
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET my trips:
//   - Admin: trips they created
//   - Manager: trips they manage
//   - Traveler: trips they joined (travelers array)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    let trips;
    if (req.user.role === 'admin') {
      trips = await Trip.find({ createdBy: req.user.id })
        .populate('travelers', 'name email')
        .populate('assignedManagers', 'name email role');
    } else if (req.user.role === 'manager') {
      trips = await Trip.find({ assignedManagers: req.user.id })
        .populate('createdBy', 'name')
        .populate('travelers', 'name email')
        .populate('assignedManagers', 'name email role');
    } else {
      // traveler: trips they have joined
      trips = await Trip.find({ travelers: req.user.id })
        .populate('createdBy', 'name')
        .populate('travelers', 'name email')
        .populate('assignedManagers', 'name email role');
    }
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// JOIN a trip (traveler joins a public trip)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(400).json({ message: 'Admins cannot join trips' });
    }
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (!trip.isPublic) return res.status(403).json({ message: 'This trip is not open for joining' });

    const alreadyJoined = trip.travelers.map(id => id.toString()).includes(req.user.id);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this trip' });
    }

    trip.travelers.push(req.user.id);
    await trip.save();
    res.json({ message: 'Successfully joined the trip' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LEAVE a trip
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    trip.travelers = trip.travelers.filter(id => id.toString() !== req.user.id);
    await trip.save();
    res.json({ message: 'You have left the trip' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single trip (all authenticated users can view public trips)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('travelers', 'name')
      .populate('assignedManagers', 'name email role');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Non-public trips only accessible by admin or assigned managers
    if (!trip.isPublic && req.user.role !== 'admin') {
      const isManager = trip.assignedManagers.some(u => u._id.toString() === req.user.id);
      if (!isManager) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create trip (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create trips' });
    }
    const trip = new Trip({ ...req.body, createdBy: req.user.id });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update trip (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update trips' });
    }
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete trip (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete trips' });
    }
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

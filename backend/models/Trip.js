const mongoose = require('mongoose');

const itineraryItemSchema = new mongoose.Schema({
  day: Number,
  title: String,
  description: String,
  location: String,
  time: String,
});

const budgetItemSchema = new mongoose.Schema({
  category: String,
  amount: Number,
  description: String,
});

const tripSchema = new mongoose.Schema({
  title: { type: String, required: true },
  destination: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  duration: { type: Number }, // in days
  budget: { type: Number, default: 0 },
  budgetItems: [budgetItemSchema],
  itinerary: [itineraryItemSchema],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  image: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  travelers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // assignedManagers: managers assigned by admin to manage this trip
  assignedManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);

// models/rental.js
const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  book: {
    type: Number,
    ref: 'Book',
    required: true,
  },
  rentedBy: {
    type: String,
    required: true, // Assuming the renter's name for simplicity
  },
  rentalDate: {
    type: String,
    default: Date.now,
  },
  returnDate: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['rented', 'returned'],
    default: 'rented',
  },
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;

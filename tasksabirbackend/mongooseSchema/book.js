// models/book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  bookId: {
    type: Number,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  availableCopies: {
    type: Number,
    default: 1,
  },
  pricePerDay: {
    type: Number,
    required: true,
  },
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;

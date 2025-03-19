// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const indexRoute = require('./routes/index');

// Initialize dotenv to load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Routes
app.use('/', indexRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

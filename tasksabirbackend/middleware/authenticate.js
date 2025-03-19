const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken");

// Middleware to authenticate the user based on the JWT token
const authenticateMiddleware = (req, res, next) => {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1];  // Expected format: "Bearer token"
  
    // If no token, send an error
    if (!token) {
      return res.status(403).json({ message: 'No token provided. Access denied.' });
    }
  
    try {
      // Verify the token using the secret key stored in environment variable
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Attach user information (from decoded token) to the request object
      req.user = decoded;
  
      // Proceed to the next middleware or route handler
      next();
    } catch (err) {
      // If the token is invalid or expired, send an error
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
  
  module.exports = authenticateMiddleware;
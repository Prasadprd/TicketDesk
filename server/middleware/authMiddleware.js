const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token and adds the user to the request object
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (remove 'Bearer' prefix)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Middleware to check if user has admin role
 * Must be used after the protect middleware
 */
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

/**
 * Middleware to check if user has specific role
 * Must be used after the protect middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }
    console.log("from authMiddleware",req.user)
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Not authorized as ${req.user.role}`);
    }

    next();
  });
};

module.exports = { protect, admin, authorize };
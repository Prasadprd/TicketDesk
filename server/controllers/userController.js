/**
 * @desc    Search users by name (for ticket assignment)
 * @route   GET /api/users/search?name=John
 * @access  Private
 */

const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');


const searchUsers = asyncHandler(async (req, res) => {
  const { name, project } = req.query;
  if (!name) {
    return res.status(400).json({ message: 'Name query is required' });
  }
  // Optionally filter by project membership
  let filter = { name: { $regex: name, $options: 'i' } };
  if (project) {
    // Only users who are members of the project
    const Project = require('../models/projectModel');
    const proj = await Project.findById(project);
    if (proj) {
      const memberIds = proj.members.map(m => m.user);
      filter._id = { $in: memberIds };
    }
  }
  const users = await User.find(filter).select('name email avatar');
  res.json(users);
});


/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Log activity
    await Activity.logActivity({
      user: user._id,
      action: 'created',
      entityType: 'user',
      entityId: user._id,
      details: { name: user.name },
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate a user
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);

  // Check for user email
  const user = await User.findOne({ email });
  console.log("User found:", user ? user._id : "No user found");
  if (user && (await user.matchPassword(password))) {
    // Update last login
    console.log("User authenticated:", user._id);
    user.lastLogin = Date.now();
    await user.save();

    // Log activity
    await Activity.logActivity({
      user: user._id,
      action: 'logged_in',
      entityType: 'user',
      entityId: user._id,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json(user.getProfile());
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio || user.bio;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Log activity
    await Activity.logActivity({
      user: user._id,
      action: 'updated',
      entityType: 'user',
      entityId: user._id,
      details: { name: user.name },
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Check if trying to delete self
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    await user.remove();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'deleted',
      entityType: 'user',
      entityId: user._id,
      details: { name: user.name },
    });

    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await user.save();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'updated',
      entityType: 'user',
      entityId: user._id,
      details: { name: user.name, role: user.role },
    });

    res.json({
      _id: updatedUser._id,   
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Get user activity
 * @route   GET /api/users/:id/activity
 * @access  Private
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id;
  const limit = parseInt(req.query.limit) || 20;

  const activities = await Activity.getRecentForUser(userId, limit);

  res.json(activities);
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getUserActivity,
  searchUsers,
};
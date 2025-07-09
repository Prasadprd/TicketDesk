const express = require('express');
const router = express.Router();
const {
  getUserActivity,
  getProjectActivity,
  getTeamActivity,
  getEntityActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// Routes
router.get('/user/:userId?', protect, getUserActivity);
router.get('/project/:projectId', protect, getProjectActivity);
router.get('/team/:teamId', protect, getTeamActivity);
router.get('/entity/:entityType/:entityId', protect, getEntityActivity);

module.exports = router;
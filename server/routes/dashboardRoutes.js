const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOverviewStats,
  getTicketDistribution,
  getProjectStats,
} = require('../controllers/dashboardController');

// Dashboard overview
router.get('/overview', protect, getOverviewStats);
// Ticket distribution (status, priority, type)
router.get('/ticket-distribution', protect, getTicketDistribution);
// Project statistics (ticket counts per project)
router.get('/project-stats', protect, getProjectStats);

module.exports = router;

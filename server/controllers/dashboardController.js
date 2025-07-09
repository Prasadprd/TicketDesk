const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const Ticket = require('../models/ticketModel');
const Team = require('../models/teamModel');

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/dashboard/overview
 * @access  Private
 */
const getOverviewStats = asyncHandler(async (req, res) => {
  const [userCount, projectCount, ticketCount, teamCount] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Ticket.countDocuments(),
    Team.countDocuments(),
  ]);

  res.json({
    users: userCount,
    projects: projectCount,
    tickets: ticketCount,
    teams: teamCount,
  });
});

/**
 * @desc    Get ticket distribution by status, priority, and type
 * @route   GET /api/dashboard/ticket-distribution
 * @access  Private
 */
const getTicketDistribution = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const projects = await Project.find({ 'members.user': userId });
  const projectIds = projects.map(p => p._id);

  // Aggregate ticket counts by status, priority, and type for user's projects
  const [byStatus, byPriority, byType] = await Promise.all([
    Ticket.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    byStatus,
    byPriority,
    byType,
  });
});

/**
 * @desc    Get project statistics (ticket counts per project)
 * @route   GET /api/dashboard/project-stats
 * @access  Private
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const projects = await Project.find({ 'members.user': userId });
  const projectIds = projects.map(p => p._id);

  const stats = await Ticket.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);

  // Attach project names
  const projectMap = {};
  projects.forEach(p => { projectMap[p._id] = p.name; });
  const result = stats.map(s => ({ project: projectMap[s._id] || s._id, count: s.count }));

  res.json(result);
});

module.exports = {
  getOverviewStats,
  getTicketDistribution,
  getProjectStats,
};

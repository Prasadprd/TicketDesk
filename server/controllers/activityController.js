const asyncHandler = require('express-async-handler');
const Activity = require('../models/activityModel');
const Project = require('../models/projectModel');
const Team = require('../models/teamModel');

/**
 * @desc    Get user activity
 * @route   GET /api/activities/user/:userId
 * @access  Private
 */
const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // If requesting another user's activity, check if they share a team or project
  if (userId !== req.user._id.toString()) {
    // Get teams where both users are members
    const sharedTeams = await Team.find({
      'members.user': { $all: [req.user._id, userId] },
    });

    // Get projects where both users are members
    const sharedProjects = await Project.find({
      'members.user': { $all: [req.user._id, userId] },
    });

    // If they don't share any teams or projects, deny access
    if (sharedTeams.length === 0 && sharedProjects.length === 0) {
      res.status(403);
      throw new Error('Not authorized to view this user\'s activity');
    }
  }

  const activities = await Activity.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key')
    .populate('team', 'name');

  // Get total count for pagination
  const total = await Activity.countDocuments({ user: userId });

  res.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get project activity
 * @route   GET /api/activities/project/:projectId
 * @access  Private
 */
const getProjectActivity = asyncHandler(async (req, res) => {
  const projectId = req.params.projectId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Check if project exists and user is a member
  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  const activities = await Activity.find({ project: projectId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key')
    .populate('team', 'name');

  // Get total count for pagination
  const total = await Activity.countDocuments({ project: projectId });

  res.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get team activity
 * @route   GET /api/activities/team/:teamId
 * @access  Private
 */
const getTeamActivity = asyncHandler(async (req, res) => {
  const teamId = req.params.teamId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Check if team exists and user is a member
  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  if (!team.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this team');
  }

  const activities = await Activity.find({ team: teamId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key')
    .populate('team', 'name');

  // Get total count for pagination
  const total = await Activity.countDocuments({ team: teamId });

  res.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get entity activity (ticket, comment, etc.)
 * @route   GET /api/activities/entity/:entityType/:entityId
 * @access  Private
 */
const getEntityActivity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Validate entity type
  const validEntityTypes = ['ticket', 'project', 'team', 'user'];
  if (!validEntityTypes.includes(entityType)) {
    res.status(400);
    throw new Error('Invalid entity type');
  }

  // For tickets and projects, check if user has access
  if (entityType === 'ticket') {
    const ticket = await Ticket.findById(entityId);
    if (!ticket) {
      res.status(404);
      throw new Error('Ticket not found');
    }

    const project = await Project.findById(ticket.project);
    if (!project.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this ticket');
    }
  } else if (entityType === 'project') {
    const project = await Project.findById(entityId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (!project.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }
  } else if (entityType === 'team') {
    const team = await Team.findById(entityId);
    if (!team) {
      res.status(404);
      throw new Error('Team not found');
    }

    if (!team.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this team');
    }
  } else if (entityType === 'user' && entityId !== req.user._id.toString()) {
    // If requesting another user's activity, check if they share a team or project
    const sharedTeams = await Team.find({
      'members.user': { $all: [req.user._id, entityId] },
    });

    const sharedProjects = await Project.find({
      'members.user': { $all: [req.user._id, entityId] },
    });

    if (sharedTeams.length === 0 && sharedProjects.length === 0) {
      res.status(403);
      throw new Error('Not authorized to view this user\'s activity');
    }
  }

  const activities = await Activity.find({
    entityType,
    entityId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key')
    .populate('team', 'name');

  // Get total count for pagination
  const total = await Activity.countDocuments({
    entityType,
    entityId,
  });

  res.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

module.exports = {
  getUserActivity,
  getProjectActivity,
  getTeamActivity,
  getEntityActivity,
};
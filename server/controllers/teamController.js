const asyncHandler = require('express-async-handler');
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private
 */
const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Check if team with the same name already exists
  const teamExists = await Team.findOne({ name });

  if (teamExists) {
    res.status(400);
    throw new Error('Team with this name already exists');
  }

  // Create team
  const team = await Team.create({
    name,
    description,
    owner: req.user._id,
    members: [
      {
        user: req.user._id,
        role: 'admin',
        joinedAt: Date.now(),
      },
    ],
  });

  if (team) {
    // Add team to user's teams
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { teams: team._id } },
      { new: true }
    );

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'created',
      entityType: 'team',
      entityId: team._id,
      team: team._id,
      details: { name: team.name },
    });

    res.status(201).json(team);
  } else {
    res.status(400);
    throw new Error('Invalid team data');
  }
});

/**
 * @desc    Get all teams
 * @route   GET /api/teams
 * @access  Private
 */
const getTeams = asyncHandler(async (req, res) => {
  // Get teams where user is a member
  const teams = await Team.find({
    'members.user': req.user._id,
  })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('projects', 'name key');

  res.json(teams);
});

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('projects', 'name key');

  if (team) {
    // Check if user is a member of the team
    if (!team.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this team');
    }

    res.json(team);
  } else {
    res.status(404);
    throw new Error('Team not found');
  }
});

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private/Admin
 */
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (team) {
    // Check if user is an admin of the team
    if (!team.isAdmin(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to update this team');
    }

    team.name = req.body.name || team.name;
    team.description = req.body.description || team.description;
    team.avatar = req.body.avatar || team.avatar;
    team.isActive = req.body.isActive !== undefined ? req.body.isActive : team.isActive;

    const updatedTeam = await team.save();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'updated',
      entityType: 'team',
      entityId: team._id,
      team: team._id,
      details: { name: team.name },
    });

    res.json(updatedTeam);
  } else {
    res.status(404);
    throw new Error('Team not found');
  }
});

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private/Admin
 */
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (team) {
    // Check if user is the owner of the team
    if (team.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the team owner can delete the team');
    }

    // Remove team from all users' teams array
    await User.updateMany(
      { teams: team._id },
      { $pull: { teams: team._id } }
    );

    await team.remove();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'deleted',
      entityType: 'team',
      entityId: team._id,
      details: { name: team.name },
    });

    res.json({ message: 'Team removed' });
  } else {
    res.status(404);
    throw new Error('Team not found');
  }
});

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 * @access  Private/Admin
 */
const addTeamMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  const team = await Team.findById(req.params.id);
  const user = await User.findById(userId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user is an admin of the team
  if (!team.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to add members to this team');
  }

  // Check if user is already a member
  if (team.isMember(userId)) {
    res.status(400);
    throw new Error('User is already a member of this team');
  }

  // Add member to team
  await team.addMember(userId, role || 'developer');

  // Add team to user's teams
  await User.findByIdAndUpdate(
    userId,
    { $push: { teams: team._id } },
    { new: true }
  );

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'team',
    entityId: team._id,
    team: team._id,
    details: { action: 'added_member', member: user.name, role: role || 'developer' },
  });

  // Create notification for the added user
  await Notification.createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'team_invite',
    title: 'Added to Team',
    message: `You have been added to the team ${team.name} as a ${role || 'developer'}.`,
    entityType: 'team',
    entityId: team._id,
    link: `/teams/${team._id}`,
  });

  res.json(team);
});

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private/Admin
 */
const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  const userId = req.params.userId;

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is an admin of the team or removing themselves
  if (!team.isAdmin(req.user._id) && req.user._id.toString() !== userId) {
    res.status(403);
    throw new Error('Not authorized to remove members from this team');
  }

  // Check if user is the owner
  if (team.owner.toString() === userId) {
    res.status(400);
    throw new Error('Cannot remove the team owner');
  }

  // Check if user is a member
  if (!team.isMember(userId)) {
    res.status(400);
    throw new Error('User is not a member of this team');
  }

  // Remove member from team
  await team.removeMember(userId);

  // Remove team from user's teams
  await User.findByIdAndUpdate(
    userId,
    { $pull: { teams: team._id } },
    { new: true }
  );

  // Get user name for activity log
  const user = await User.findById(userId);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'team',
    entityId: team._id,
    team: team._id,
    details: { action: 'removed_member', member: user ? user.name : userId },
  });

  res.json(team);
});

/**
 * @desc    Update member role in team
 * @route   PUT /api/teams/:id/members/:userId
 * @access  Private/Admin
 */
const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const team = await Team.findById(req.params.id);
  const userId = req.params.userId;

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is an admin of the team
  if (!team.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update member roles in this team');
  }

  // Check if user is the owner
  if (team.owner.toString() === userId) {
    res.status(400);
    throw new Error('Cannot change the role of the team owner');
  }

  // Check if user is a member
  if (!team.isMember(userId)) {
    res.status(400);
    throw new Error('User is not a member of this team');
  }

  // Update member role
  await team.updateMemberRole(userId, role);

  // Get user name for activity log
  const user = await User.findById(userId);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'team',
    entityId: team._id,
    team: team._id,
    details: { action: 'updated_member_role', member: user ? user.name : userId, role },
  });

  // Create notification for the user
  await Notification.createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'team_update',
    title: 'Role Updated',
    message: `Your role in the team ${team.name} has been updated to ${role}.`,
    entityType: 'team',
    entityId: team._id,
    link: `/teams/${team._id}`,
  });

  res.json(team);
});

/**
 * @desc    Get team activity
 * @route   GET /api/teams/:id/activity
 * @access  Private
 */
const getTeamActivity = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is a member of the team
  if (!team.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this team');
  }

  const limit = parseInt(req.query.limit) || 20;

  const activities = await Activity.getRecentForTeam(team._id, limit);

  res.json(activities);
});

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  getTeamActivity,
};
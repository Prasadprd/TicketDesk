const asyncHandler = require('express-async-handler');
const Project = require('../models/projectModel');
const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, key, team, category, startDate, endDate } = req.body;

  // Check if project with the same key already exists
  const projectExists = await Project.findOne({ key });

  if (projectExists) {
    res.status(400);
    throw new Error('Project with this key already exists');
  }

  // Check if team exists
  const teamExists = await Team.findById(team);

  if (!teamExists) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if user is a member of the team
  if (!teamExists.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You must be a member of the team to create a project');
  }

  // Create project
  const project = await Project.create({
    name,
    description,
    key,
    owner: req.user._id,
    team,
    category: category || 'software',
    startDate: startDate || Date.now(),
    endDate: endDate || null,
    members: [
      {
        user: req.user._id,
        role: 'admin',
        joinedAt: Date.now(),
      },
    ],
  });

  if (project) {
    // Add project to team's projects
    await Team.findByIdAndUpdate(
      team,
      { $push: { projects: project._id } },
      { new: true }
    );

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      team: project.team,
      details: { name: project.name, key: project.key },
    });

    // Notify team members
    const teamMembers = teamExists.members.map(member => member.user);
    
    for (const memberId of teamMembers) {
      // Don't notify the creator
      if (memberId.toString() === req.user._id.toString()) continue;
      
      await Notification.createNotification({
        recipient: memberId,
        sender: req.user._id,
        type: 'project_update',
        title: 'New Project Created',
        message: `A new project ${project.name} (${project.key}) has been created in team ${teamExists.name}.`,
        entityType: 'project',
        entityId: project._id,
        link: `/projects/${project._id}`,
      });
    }

    res.status(201).json(project);
  } else {
    res.status(400);
    throw new Error('Invalid project data');
  }
});

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  // Get projects where user is a member
  const projects = await Project.find({
    'members.user': req.user._id,
  })
    .populate('owner', 'name email avatar')
    .populate('team', 'name')
    .populate('members.user', 'name email avatar');

  res.json(projects);
});

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('team', 'name')
    .populate('members.user', 'name email avatar');

  if (project) {
    // Check if user is a member of the project
    if (!project.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    res.json(project);
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    // Check if user is an admin of the project
    if (!project.isAdmin(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to update this project');
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.category = req.body.category || project.category;
    project.status = req.body.status || project.status;
    project.startDate = req.body.startDate || project.startDate;
    project.endDate = req.body.endDate || project.endDate;

    const updatedProject = await project.save();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      team: project.team,
      details: { name: project.name, key: project.key },
    });

    res.json(updatedProject);
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    // Check if user is the owner of the project
    if (project.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the project owner can delete the project');
    }

    // Remove project from team's projects array
    await Team.findByIdAndUpdate(
      project.team,
      { $pull: { projects: project._id } },
      { new: true }
    );

    await project.remove();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'deleted',
      entityType: 'project',
      entityId: project._id,
      team: project.team,
      details: { name: project.name, key: project.key },
    });

    res.json({ message: 'Project removed' });
  } else {
    res.status(404);
    throw new Error('Project not found');
  }
});

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private/Admin
 */
const addProjectMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  const project = await Project.findById(req.params.id);
  const user = await User.findById(userId);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user is an admin of the project
  if (!project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to add members to this project');
  }

  // Check if user is already a member
  if (project.isMember(userId)) {
    res.status(400);
    throw new Error('User is already a member of this project');
  }

  // Check if user is a member of the team
  const team = await Team.findById(project.team);
  if (!team.isMember(userId)) {
    res.status(400);
    throw new Error('User must be a member of the team to join the project');
  }

  // Add member to project
  await project.addMember(userId, role || 'developer');

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'added_member', member: user.name, role: role || 'developer' },
  });

  // Create notification for the added user
  await Notification.createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'project_invite',
    title: 'Added to Project',
    message: `You have been added to the project ${project.name} (${project.key}) as a ${role || 'developer'}.`,
    entityType: 'project',
    entityId: project._id,
    link: `/projects/${project._id}`,
  });

  res.json(project);
});

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private/Admin
 */
const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  const userId = req.params.userId;

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is an admin of the project or removing themselves
  if (!project.isAdmin(req.user._id) && req.user._id.toString() !== userId) {
    res.status(403);
    throw new Error('Not authorized to remove members from this project');
  }

  // Check if user is the owner
  if (project.owner.toString() === userId) {
    res.status(400);
    throw new Error('Cannot remove the project owner');
  }

  // Check if user is a member
  if (!project.isMember(userId)) {
    res.status(400);
    throw new Error('User is not a member of this project');
  }

  // Remove member from project
  await project.removeMember(userId);

  // Get user name for activity log
  const user = await User.findById(userId);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'removed_member', member: user ? user.name : userId },
  });

  res.json(project);
});

/**
 * @desc    Update member role in project
 * @route   PUT /api/projects/:id/members/:userId
 * @access  Private/Admin
 */
const updateProjectMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const project = await Project.findById(req.params.id);
  const userId = req.params.userId;

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is an admin of the project
  if (!project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update member roles in this project');
  }

  // Check if user is the owner
  if (project.owner.toString() === userId) {
    res.status(400);
    throw new Error('Cannot change the role of the project owner');
  }

  // Check if user is a member
  if (!project.isMember(userId)) {
    res.status(400);
    throw new Error('User is not a member of this project');
  }

  // Update member role
  await project.updateMemberRole(userId, role);

  // Get user name for activity log
  const user = await User.findById(userId);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'updated_member_role', member: user ? user.name : userId, role },
  });

  // Create notification for the user
  await Notification.createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'project_update',
    title: 'Role Updated',
    message: `Your role in the project ${project.name} (${project.key}) has been updated to ${role}.`,
    entityType: 'project',
    entityId: project._id,
    link: `/projects/${project._id}`,
  });

  res.json(project);
});

/**
 * @desc    Get project activity
 * @route   GET /api/projects/:id/activity
 * @access  Private
 */
const getProjectActivity = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is a member of the project
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  const limit = parseInt(req.query.limit) || 20;

  const activities = await Activity.getRecentForProject(project._id, limit);

  res.json(activities);
});

/**
 * @desc    Update project ticket types
 * @route   PUT /api/projects/:id/ticket-types
 * @access  Private/Admin
 */
const updateProjectTicketTypes = asyncHandler(async (req, res) => {
  const { ticketTypes } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is an admin of the project
  if (!project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  project.ticketTypes = ticketTypes;
  const updatedProject = await project.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'updated_ticket_types' },
  });

  res.json(updatedProject);
});

/**
 * @desc    Update project ticket statuses
 * @route   PUT /api/projects/:id/ticket-statuses
 * @access  Private/Admin
 */
const updateProjectTicketStatuses = asyncHandler(async (req, res) => {
  const { ticketStatuses } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is an admin of the project
  if (!project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  project.ticketStatuses = ticketStatuses;
  const updatedProject = await project.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'updated_ticket_statuses' },
  });

  res.json(updatedProject);
});

/**
 * @desc    Update project ticket priorities
 * @route   PUT /api/projects/:id/ticket-priorities
 * @access  Private/Admin
 */
const updateProjectTicketPriorities = asyncHandler(async (req, res) => {
  const { ticketPriorities } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is an admin of the project
  if (!project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  project.ticketPriorities = ticketPriorities;
  const updatedProject = await project.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
    team: project.team,
    details: { action: 'updated_ticket_priorities' },
  });

  res.json(updatedProject);
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  getProjectActivity,
  updateProjectTicketTypes,
  updateProjectTicketStatuses,
  updateProjectTicketPriorities,
};
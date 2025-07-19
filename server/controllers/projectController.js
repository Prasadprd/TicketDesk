const asyncHandler = require('express-async-handler');
const Project = require('../models/projectModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');
const Ticket = require('../models/ticketModel');
// No Team model import needed as team functionality has been removed

/**
 * Generate a project key from the project name
 * @param {string} name - Project name
 * @returns {string} - Project key
 */
const generateProjectKey = (name) => {
  // Extract first letter of each word, uppercase, and limit to 5 characters
  const key = name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5);
  
  // If key is too short, add random characters
  if (key.length < 2) {
    return key + Math.random().toString(36).substring(2, 4).toUpperCase();
  }
  
  return key;
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Admin and Developer only)
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, category, startDate, endDate } = req.body;
  
  // Check if user is authorized to create a project (admin or developer only)
  if (req.user.role !== 'admin' && req.user.role !== 'developer') {
    res.status(403);
    throw new Error('Only admins and developers can create projects');
  }
  
  // Auto-generate project key from project name
  const key = generateProjectKey(name);
  
  // Check if project with the same key already exists
  const projectExists = await Project.findOne({ key });

  if (projectExists) {
    res.status(400);
    throw new Error('Project with this key already exists. Please try a different name.');
  }

  // Create project
  const project = await Project.create({
    name,
    description,
    key,
    owner: req.user._id,
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
    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      project: project._id,
      details: { name: project.name, key: project.key },
    });

    // No need to notify team members as we've removed team functionality

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
  let query = {};
  
  // Role-based access control for projects
  if (req.user.role === 'admin') {
    // Admins can see all projects
    query = {};
  } else if (req.user.role === 'developer') {
    // Developers can see projects they created or are part of
    query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };
  } else {
    // Submitters can only see projects they are part of
    query = { 'members.user': req.user._id };
  }
  
  // Get projects based on role-specific query
  const projects = await Project.find(query)
    .populate('owner', 'name email avatar')
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

    // No need to update team as we've removed team functionality

    await project.remove();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'deleted',
      entityType: 'project',
      entityId: project._id,
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

  // No team check required as we've removed team functionality

  // Add member to project
  await project.addMember(userId, role || 'developer');

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'project',
    entityId: project._id,
    project: project._id,
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
    details: { action: 'updated_ticket_priorities' },
  });

  res.json(updatedProject);
});

/**
 * @desc    Get project statistics
 * @route   GET /api/projects/:id/stats
 * @access  Private
 */
const getProjectStats = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is a member of the project
  if (!project.members.find(m => m.user.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to view project statistics');
  }

  // Get tickets for this project
  const tickets = await Ticket.find({ project: project._id });

  // Calculate statistics
  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status !== 'Closed').length,
    closedTickets: tickets.filter(t => t.status === 'Closed').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'High').length,
    byStatus: {
      'New': tickets.filter(t => t.status === 'New').length,
      'In Progress': tickets.filter(t => t.status === 'In Progress').length,
      'Review': tickets.filter(t => t.status === 'Review').length,
      'Closed': tickets.filter(t => t.status === 'Closed').length
    },
    byPriority: {
      'Low': tickets.filter(t => t.priority === 'Low').length,
      'Medium': tickets.filter(t => t.priority === 'Medium').length,
      'High': tickets.filter(t => t.priority === 'High').length
    },
    byType: {
      'Bug': tickets.filter(t => t.type === 'Bug').length,
      'Feature': tickets.filter(t => t.type === 'Feature').length,
      'Task': tickets.filter(t => t.type === 'Task').length
    }
  };

  res.json(stats);
});

/**
 * @desc    Get project tickets
 * @route   GET /api/projects/:id/tickets
 * @access  Private
 */
const getProjectTickets = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is a member of the project
  if (!project.members.find(m => m.user.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('Not authorized to view project tickets');
  }

  // Get tickets for this project
  const tickets = await Ticket.find({ project: project._id })
    .populate('assignee', 'name')
    .sort({ createdAt: -1 });

  res.json(tickets);
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateMemberRole: updateProjectMemberRole,
  getProjectActivity,
  updateTicketTypes: updateProjectTicketTypes,
  updateTicketStatuses: updateProjectTicketStatuses,
  updateTicketPriorities: updateProjectTicketPriorities,
  getProjectStats,
  getProjectTickets,
};
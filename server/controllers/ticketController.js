const asyncHandler = require('express-async-handler');
const Ticket = require('../models/ticketModel');
const Project = require('../models/projectModel');
const Comment = require('../models/commentModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

/**
 * @desc    Create a new ticket
 * @route   POST /api/tickets
 * @access  Private
 */
const createTicket = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    project,
    type,
    priority,
    status,
    assignee,
    dueDate,
    estimatedTime,
    labels,
  } = req.body;

  // Check if project exists
  const projectExists = await Project.findById(project);
  console.log(projectExists.ticketTypes)

  if (!projectExists) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is a member of the project
  if (!projectExists.isMember(req.user._id)) {
    res.status(403);
    throw new Error('You must be a member of the project to create a ticket');
  }

  // Validate ticket type, status, and priority against project settings
  const isValidType = projectExists.ticketTypes.some(tt => tt.name === type);
  console.log("Ticket is valid?",isValidType)
  if (!isValidType) {
    res.status(400);
    throw new Error(`Invalid ticket type. Valid types are: ${projectExists.ticketTypes.join(', ')}`);
  }

  const isValidStatus = projectExists.ticketStatuses.some(ts => ts.name === status);
  if (!isValidStatus) {
    res.status(400);
    throw new Error(`Invalid ticket status. Valid statuses are: ${projectExists.ticketStatuses.join(', ')}`);
  }

  const isValidPriority = projectExists.ticketPriorities.some(tp => tp.name === priority);
  if (!isValidPriority) {
    res.status(400);
    throw new Error(`Invalid ticket priority. Valid priorities are: ${projectExists.ticketPriorities.join(', ')}`);
  }

  // If assignee is provided, check if they are a member of the project
  if (assignee && !projectExists.isMember(assignee)) {
    res.status(400);
    throw new Error('Assignee must be a member of the project');
  }

  // Create ticket
  const ticket = await Ticket.create({
    title,
    description,
    project,
    reporter: req.user._id,
    type,
    priority,
    status,
    assignee: assignee || null,
    dueDate: dueDate || null,
    estimatedTime: estimatedTime || 0,
    labels: labels || [],
  });

  if (ticket) {
    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'created',
      entityType: 'ticket',
      entityId: ticket._id,
      project: ticket.project,
      team: projectExists.team,
      details: { title: ticket.title, ticketNumber: ticket.ticketNumber },
    });

    // Notify assignee if assigned
    if (assignee) {
      await Notification.createNotification({
        recipient: assignee,
        sender: req.user._id,
        type: 'ticket_assigned',
        title: 'Ticket Assigned',
        message: `You have been assigned to ticket ${ticket.ticketNumber}: ${ticket.title}`,
        entityType: 'ticket',
        entityId: ticket._id,
        link: `/tickets/${ticket._id}`,
      });
    }

    res.status(201).json(ticket);
  } else {
    res.status(400);
    throw new Error('Invalid ticket data');
  }
});

/**
 * @desc    Get all tickets
 * @route   GET /api/tickets
 * @access  Private
 */
const getTickets = asyncHandler(async (req, res) => {
  // Get query parameters for filtering
  const { project, status, priority, type, assignee, reporter, search } = req.query;

  // Build filter object
  const filter = {};

  // If project is specified, check if user is a member of the project
  if (project) {
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (!projectExists.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }

    filter.project = project;
  } else {
    // If no project specified, get all projects user is a member of
    const projects = await Project.find({ 'members.user': req.user._id });
    filter.project = { $in: projects.map(p => p._id) };
  }

  // Add other filters if provided
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (assignee === 'me') filter.assignee = req.user._id;
  else if (assignee === 'unassigned') filter.assignee = null;
  else if (assignee) filter.assignee = assignee;
  if (reporter === 'me') filter.reporter = req.user._id;
  else if (reporter) filter.reporter = reporter;

  // Search in title or description
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { ticketNumber: { $regex: search, $options: 'i' } },
    ];
  }

  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get sort parameters
  const sort = {};
  if (req.query.sortField) {
    sort[req.query.sortField] = req.query.sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort by creation date, newest first
  }

  // Get tickets
  const tickets = await Ticket.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('reporter', 'name email avatar')
    .populate('assignee', 'name email avatar')
    .populate('project', 'name key');

  // Get total count for pagination
  const total = await Ticket.countDocuments(filter);

  res.json({
    tickets,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

/**
 * @desc    Get ticket by ID
 * @route   GET /api/tickets/:id
 * @access  Private
 */
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('reporter', 'name email avatar')
    .populate('assignee', 'name email avatar')
    .populate('project', 'name key ticketTypes ticketStatuses ticketPriorities')
    .populate('watchers', 'name email avatar');

  if (ticket) {
    // Check if user is a member of the project
    const project = await Project.findById(ticket.project._id);
    if (!project.isMember(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to access this ticket');
    }

    // Get comments for the ticket
    const comments = await Comment.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate('user', 'name email avatar');

    res.json({ ticket, comments });
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

/**
 * @desc    Update ticket
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this ticket');
  }

  // Validate ticket type, status, and priority against project settings
  if (req.body.type && !project.ticketTypes.includes(req.body.type)) {
    res.status(400);
    throw new Error(`Invalid ticket type. Valid types are: ${project.ticketTypes.join(', ')}`);
  }

  if (req.body.status && !project.ticketStatuses.includes(req.body.status)) {
    res.status(400);
    throw new Error(`Invalid ticket status. Valid statuses are: ${project.ticketStatuses.join(', ')}`);
  }

  if (req.body.priority && !project.ticketPriorities.includes(req.body.priority)) {
    res.status(400);
    throw new Error(`Invalid ticket priority. Valid priorities are: ${project.ticketPriorities.join(', ')}`);
  }

  // If assignee is provided, check if they are a member of the project
  if (req.body.assignee && !project.isMember(req.body.assignee)) {
    res.status(400);
    throw new Error('Assignee must be a member of the project');
  }

  // Track changes for history
  const changes = {};
  const fieldsToTrack = [
    'title',
    'description',
    'type',
    'status',
    'priority',
    'assignee',
    'dueDate',
    'estimatedTime',
    'labels',
  ];

  fieldsToTrack.forEach(field => {
    if (req.body[field] !== undefined && 
        JSON.stringify(ticket[field]) !== JSON.stringify(req.body[field])) {
      changes[field] = {
        from: ticket[field],
        to: req.body[field],
      };
    }
  });

  // Update ticket fields
  Object.keys(req.body).forEach(key => {
    if (key !== 'project' && key !== 'reporter' && key !== 'ticketNumber') {
      ticket[key] = req.body[key];
    }
  });

  // Add history entry if there are changes
  if (Object.keys(changes).length > 0) {
    ticket.history.push({
      user: req.user._id,
      changes,
      timestamp: Date.now(),
    });
  }

  const updatedTicket = await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { title: ticket.title, ticketNumber: ticket.ticketNumber, changes },
  });

  // Notify assignee if changed
  if (changes.assignee && changes.assignee.to) {
    await Notification.createNotification({
      recipient: changes.assignee.to,
      sender: req.user._id,
      type: 'ticket_assigned',
      title: 'Ticket Assigned',
      message: `You have been assigned to ticket ${ticket.ticketNumber}: ${ticket.title}`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });
  }

  // Notify watchers about the update
  for (const watcher of ticket.watchers) {
    // Don't notify the user who made the update
    if (watcher.toString() === req.user._id.toString()) continue;
    
    await Notification.createNotification({
      recipient: watcher,
      sender: req.user._id,
      type: 'ticket_update',
      title: 'Ticket Updated',
      message: `Ticket ${ticket.ticketNumber} has been updated: ${ticket.title}`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });
  }

  res.json(updatedTicket);
});

/**
 * @desc    Delete ticket
 * @route   DELETE /api/tickets/:id
 * @access  Private/Admin
 */
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is an admin of the project or the reporter of the ticket
  const project = await Project.findById(ticket.project);
  if (!project.isAdmin(req.user._id) && ticket.reporter.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this ticket');
  }

  // Delete all comments associated with the ticket
  await Comment.deleteMany({ ticket: ticket._id });

  await ticket.remove();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'deleted',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { title: ticket.title, ticketNumber: ticket.ticketNumber },
  });

  res.json({ message: 'Ticket removed' });
});

/**
 * @desc    Add comment to ticket
 * @route   POST /api/tickets/:id/comments
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to comment on this ticket');
  }

  // Create comment
  const comment = await Comment.create({
    ticket: ticket._id,
    user: req.user._id,
    content,
    attachments: attachments || [],
  });

  // Add user to watchers if not already watching
  if (!ticket.watchers.includes(req.user._id)) {
    ticket.watchers.push(req.user._id);
    await ticket.save();
  }

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'commented',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { title: ticket.title, ticketNumber: ticket.ticketNumber },
  });

  // Notify ticket reporter, assignee, and watchers
  const notifyUsers = new Set();
  
  // Add reporter if not the commenter
  if (ticket.reporter.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticket.reporter.toString());
  }
  
  // Add assignee if exists and not the commenter
  if (ticket.assignee && ticket.assignee.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticket.assignee.toString());
  }
  
  // Add watchers except the commenter
  ticket.watchers.forEach(watcher => {
    if (watcher.toString() !== req.user._id.toString()) {
      notifyUsers.add(watcher.toString());
    }
  });
  
  // Add mentioned users from the comment
  if (comment.mentions && comment.mentions.length > 0) {
    comment.mentions.forEach(mention => {
      notifyUsers.add(mention.toString());
    });
  }
  
  // Send notifications
  for (const userId of notifyUsers) {
    await Notification.createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'ticket_comment',
      title: 'New Comment',
      message: `New comment on ticket ${ticket.ticketNumber}: ${ticket.title}`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });
  }

  const populatedComment = await Comment.findById(comment._id).populate(
    'user',
    'name email avatar'
  );

  res.status(201).json(populatedComment);
});

/**
 * @desc    Update comment
 * @route   PUT /api/tickets/:id/comments/:commentId
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  const comment = await Comment.findById(req.params.commentId);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is the author of the comment
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this comment');
  }

  // Update comment
  await comment.edit(content, req.user._id);
  
  if (attachments) {
    comment.attachments = attachments;
  }

  const updatedComment = await comment.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated_comment',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: (await Project.findById(ticket.project)).team,
    details: { title: ticket.title, ticketNumber: ticket.ticketNumber },
  });

  const populatedComment = await Comment.findById(updatedComment._id).populate(
    'user',
    'name email avatar'
  );

  res.json(populatedComment);
});

/**
 * @desc    Delete comment
 * @route   DELETE /api/tickets/:id/comments/:commentId
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  const comment = await Comment.findById(req.params.commentId);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is the author of the comment or an admin of the project
  const project = await Project.findById(ticket.project);
  if (comment.user.toString() !== req.user._id.toString() && !project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await comment.remove();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'deleted_comment',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { title: ticket.title, ticketNumber: ticket.ticketNumber },
  });

  res.json({ message: 'Comment removed' });
});

/**
 * @desc    Add watcher to ticket
 * @route   POST /api/tickets/:id/watchers
 * @access  Private
 */
const addWatcher = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this ticket');
  }

  // If userId is provided, check if that user is a member of the project
  // Otherwise, add the current user as a watcher
  const userToAdd = userId || req.user._id;
  
  if (userId && !project.isMember(userId)) {
    res.status(400);
    throw new Error('User must be a member of the project to watch the ticket');
  }

  // Add watcher if not already watching
  if (!ticket.watchers.includes(userToAdd)) {
    ticket.watchers.push(userToAdd);
    await ticket.save();

    // Log activity
    await Activity.logActivity({
      user: req.user._id,
      action: 'updated',
      entityType: 'ticket',
      entityId: ticket._id,
      project: ticket.project,
      team: project.team,
      details: { action: 'added_watcher', ticketNumber: ticket.ticketNumber },
    });
  }

  res.json(ticket);
});

/**
 * @desc    Remove watcher from ticket
 * @route   DELETE /api/tickets/:id/watchers/:userId
 * @access  Private
 */
const removeWatcher = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  const userId = req.params.userId || req.user._id;

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project or removing themselves
  const project = await Project.findById(ticket.project);
  if (userId !== req.user._id.toString() && !project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify watchers for this ticket');
  }

  // Remove watcher
  ticket.watchers = ticket.watchers.filter(
    watcher => watcher.toString() !== userId.toString()
  );
  
  await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { action: 'removed_watcher', ticketNumber: ticket.ticketNumber },
  });

  res.json(ticket);
});

/**
 * @desc    Assign ticket to user
 * @route   PUT /api/tickets/:id/assign
 * @access  Private
 */
const assignTicket = asyncHandler(async (req, res) => {
  console.log("Inside assign ticket controller",req.body)
  const { assigneeId } = req.body;
  console.log("User ID to assign:", assigneeId)
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify this ticket');
  }

  // If userId is null, unassign the ticket
  if (assigneeId === null) {
    ticket.assignee = null;
  } else {
    // Check if assignee is a member of the project
    if (!project.isMember(assigneeId)) {
      res.status(400);
      throw new Error('Assignee must be a member of the project');
    }

    ticket.assignee = assigneeId;

    // Add assignee to watchers if not already watching
    if (!ticket.watchers.includes(assigneeId)) {
      ticket.watchers.push(assigneeId);
    }

    // Create notification for the assignee
    await Notification.createNotification({
      recipient: assigneeId,
      sender: req.user._id,
      type: 'ticket_assigned',
      title: 'Ticket Assigned',
      message: `You have been assigned to ticket ${ticket.ticketNumber}: ${ticket.title}`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });
  }

  // Add to history
  ticket.history.push({
    user: req.user._id,
    changes: {
      assignee: {
        from: ticket.assignee,
        to: assigneeId,
      },
    },
    timestamp: Date.now(),
  });

  const updatedTicket = await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { 
      action: assigneeId ? 'assigned_ticket' : 'unassigned_ticket', 
      ticketNumber: ticket.ticketNumber,
      assignee: assigneeId ? (await User.findById(assigneeId)).name : 'Unassigned'
    },
  });

  res.json(updatedTicket);
});

/**
 * @desc    Update ticket status
 * @route   PUT /api/tickets/:id/status
 * @access  Private
 */
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify this ticket');
  }

  // Validate status against project settings
  if (!project.ticketStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid ticket status. Valid statuses are: ${project.ticketStatuses.join(', ')}`);
  }

  // Update status
  const oldStatus = ticket.status;
  ticket.status = status;

  // Add to history
  ticket.history.push({
    user: req.user._id,
    changes: {
      status: {
        from: oldStatus,
        to: status,
      },
    },
    timestamp: Date.now(),
  });

  const updatedTicket = await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { 
      action: 'updated_status', 
      ticketNumber: ticket.ticketNumber,
      from: oldStatus,
      to: status
    },
  });

  // Notify assignee and reporter about status change
  const notifyUsers = new Set();
  
  // Add reporter if not the updater
  if (ticket.reporter.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticket.reporter.toString());
  }
  
  // Add assignee if exists and not the updater
  if (ticket.assignee && ticket.assignee.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticket.assignee.toString());
  }
  
  // Send notifications
  for (const userId of notifyUsers) {
    await Notification.createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'ticket_update',
      title: 'Ticket Status Updated',
      message: `Status of ticket ${ticket.ticketNumber} has been changed from ${oldStatus} to ${status}`,
      entityType: 'ticket',
      entityId: ticket._id,
      link: `/tickets/${ticket._id}`,
    });
  }

  res.json(updatedTicket);
});

/**
 * @desc    Get ticket history
 * @route   GET /api/tickets/:id/history
 * @access  Private
 */
const getTicketHistory = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this ticket');
  }

  // Populate user information in history
  const history = [...ticket.history];
  const userIds = new Set(history.map(entry => entry.user.toString()));
  const users = await User.find({ _id: { $in: Array.from(userIds) } }, 'name email avatar');
  
  const userMap = {};
  users.forEach(user => {
    userMap[user._id.toString()] = user;
  });

  const populatedHistory = history.map(entry => ({
    ...entry.toObject(),
    user: userMap[entry.user.toString()],
  }));

  res.json(populatedHistory);
});

/**
 * @desc    Add attachment to ticket
 * @route   POST /api/tickets/:id/attachments
 * @access  Private
 */
const addAttachment = asyncHandler(async (req, res) => {
  const { name, url, size, type } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify this ticket');
  }

  // Add attachment
  ticket.attachments.push({
    name,
    url,
    size,
    type,
    uploadedBy: req.user._id,
    uploadedAt: Date.now(),
  });

  // Add to history
  ticket.history.push({
    user: req.user._id,
    changes: {
      attachments: {
        action: 'added',
        name,
      },
    },
    timestamp: Date.now(),
  });

  const updatedTicket = await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { 
      action: 'added_attachment', 
      ticketNumber: ticket.ticketNumber,
      attachment: name
    },
  });

  res.json(updatedTicket);
});

/**
 * @desc    Remove attachment from ticket
 * @route   DELETE /api/tickets/:id/attachments/:attachmentId
 * @access  Private
 */
const removeAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to modify this ticket');
  }

  // Find attachment
  const attachment = ticket.attachments.id(req.params.attachmentId);

  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  // Check if user is the uploader or an admin
  if (attachment.uploadedBy.toString() !== req.user._id.toString() && !project.isAdmin(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to remove this attachment');
  }

  // Store attachment name for history
  const attachmentName = attachment.name;

  // Remove attachment
  attachment.remove();

  // Add to history
  ticket.history.push({
    user: req.user._id,
    changes: {
      attachments: {
        action: 'removed',
        name: attachmentName,
      },
    },
    timestamp: Date.now(),
  });

  const updatedTicket = await ticket.save();

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: project.team,
    details: { 
      action: 'removed_attachment', 
      ticketNumber: ticket.ticketNumber,
      attachment: attachmentName
    },
  });

  res.json(updatedTicket);
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  addComment,
  updateComment,
  deleteComment,
  addWatcher,
  removeWatcher,
  assignTicket,
  updateTicketStatus,
  getTicketHistory,
  addAttachment,
  removeAttachment,
};
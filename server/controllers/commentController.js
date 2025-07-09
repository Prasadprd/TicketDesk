const asyncHandler = require('express-async-handler');
const Comment = require('../models/commentModel');
const Ticket = require('../models/ticketModel');
const Project = require('../models/projectModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');

/**
 * @desc    Create a new comment
 * @route   POST /api/comments
 * @access  Private
 */
const createComment = asyncHandler(async (req, res) => {
  const { ticket, content, attachments } = req.body;

  // Check if ticket exists
  const ticketExists = await Ticket.findById(ticket);

  if (!ticketExists) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Check if user is a member of the project
  const project = await Project.findById(ticketExists.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to comment on this ticket');
  }

  // Create comment
  const comment = await Comment.create({
    ticket,
    user: req.user._id,
    content,
    attachments: attachments || [],
  });

  // Add user to watchers if not already watching
  if (!ticketExists.watchers.includes(req.user._id)) {
    ticketExists.watchers.push(req.user._id);
    await ticketExists.save();
  }

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'commented',
    entityType: 'ticket',
    entityId: ticketExists._id,
    project: ticketExists.project,
    team: project.team,
    details: { title: ticketExists.title, ticketNumber: ticketExists.ticketNumber },
  });

  // Notify ticket reporter, assignee, and watchers
  const notifyUsers = new Set();
  
  // Add reporter if not the commenter
  if (ticketExists.reporter.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticketExists.reporter.toString());
  }
  
  // Add assignee if exists and not the commenter
  if (ticketExists.assignee && ticketExists.assignee.toString() !== req.user._id.toString()) {
    notifyUsers.add(ticketExists.assignee.toString());
  }
  
  // Add watchers except the commenter
  ticketExists.watchers.forEach(watcher => {
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
      message: `New comment on ticket ${ticketExists.ticketNumber}: ${ticketExists.title}`,
      entityType: 'ticket',
      entityId: ticketExists._id,
      link: `/tickets/${ticketExists._id}`,
    });
  }

  const populatedComment = await Comment.findById(comment._id).populate(
    'user',
    'name email avatar'
  );

  res.status(201).json(populatedComment);
});

/**
 * @desc    Get comments for a ticket
 * @route   GET /api/comments/ticket/:ticketId
 * @access  Private
 */
const getTicketComments = asyncHandler(async (req, res) => {
  const ticketId = req.params.ticketId;

  // Check if ticket exists
  const ticket = await Ticket.findById(ticketId);

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

  // Get comments for the ticket
  const comments = await Comment.find({ ticket: ticketId })
    .sort({ createdAt: 1 })
    .populate('user', 'name email avatar');

  res.json(comments);
});

/**
 * @desc    Get comment by ID
 * @route   GET /api/comments/:id
 * @access  Private
 */
const getCommentById = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).populate(
    'user',
    'name email avatar'
  );

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is a member of the project
  const ticket = await Ticket.findById(comment.ticket);
  const project = await Project.findById(ticket.project);
  if (!project.isMember(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this comment');
  }

  res.json(comment);
});

/**
 * @desc    Update comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;
  const comment = await Comment.findById(req.params.id);

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

  // Get ticket for activity logging
  const ticket = await Ticket.findById(comment.ticket);

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
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Get ticket and project for authorization check
  const ticket = await Ticket.findById(comment.ticket);
  const project = await Project.findById(ticket.project);

  // Check if user is the author of the comment or an admin of the project
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
 * @desc    Add attachment to comment
 * @route   POST /api/comments/:id/attachments
 * @access  Private
 */
const addAttachment = asyncHandler(async (req, res) => {
  const { name, url, size, type } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is the author of the comment
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this comment');
  }

  // Add attachment
  comment.attachments.push({
    name,
    url,
    size,
    type,
    uploadedAt: Date.now(),
  });

  const updatedComment = await comment.save();

  // Get ticket for activity logging
  const ticket = await Ticket.findById(comment.ticket);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated_comment',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: (await Project.findById(ticket.project)).team,
    details: { 
      action: 'added_attachment', 
      title: ticket.title, 
      ticketNumber: ticket.ticketNumber,
      attachment: name
    },
  });

  const populatedComment = await Comment.findById(updatedComment._id).populate(
    'user',
    'name email avatar'
  );

  res.json(populatedComment);
});

/**
 * @desc    Remove attachment from comment
 * @route   DELETE /api/comments/:id/attachments/:attachmentId
 * @access  Private
 */
const removeAttachment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is the author of the comment
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this comment');
  }

  // Find attachment
  const attachment = comment.attachments.id(req.params.attachmentId);

  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  // Store attachment name for activity log
  const attachmentName = attachment.name;

  // Remove attachment
  attachment.remove();

  const updatedComment = await comment.save();

  // Get ticket for activity logging
  const ticket = await Ticket.findById(comment.ticket);

  // Log activity
  await Activity.logActivity({
    user: req.user._id,
    action: 'updated_comment',
    entityType: 'ticket',
    entityId: ticket._id,
    project: ticket.project,
    team: (await Project.findById(ticket.project)).team,
    details: { 
      action: 'removed_attachment', 
      title: ticket.title, 
      ticketNumber: ticket.ticketNumber,
      attachment: attachmentName
    },
  });

  const populatedComment = await Comment.findById(updatedComment._id).populate(
    'user',
    'name email avatar'
  );

  res.json(populatedComment);
});

module.exports = {
  createComment,
  getTicketComments,
  getCommentById,
  updateComment,
  deleteComment,
  addAttachment,
  removeAttachment,
};
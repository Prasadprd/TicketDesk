const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'ticket_assigned',
        'ticket_commented',
        'ticket_status_changed',
        'ticket_priority_changed',
        'ticket_due_soon',
        'ticket_overdue',
        'mentioned',
        'team_invite',
        'project_invite',
        'project_update',
        'team_update',
        'system',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    entityType: {
      type: String,
      enum: ['ticket', 'project', 'team', 'user', 'comment', 'system'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Static method to create a notification
notificationSchema.statics.createNotification = async function (data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to prevent disrupting the main operation
    return null;
  }
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = function (userId, limit = 10) {
  return this.find({ recipient: userId, read: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar');
};

// Static method to get all notifications for a user
notificationSchema.statics.getAllForUser = function (userId, limit = 20, skip = 0) {
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar');
};

// Static method to mark a notification as read
notificationSchema.statics.markAsRead = function (notificationId) {
  return this.findByIdAndUpdate(
    notificationId,
    { read: true, readAt: Date.now() },
    { new: true }
  );
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: Date.now() }
  );
};

// Static method to delete a notification
notificationSchema.statics.deleteNotification = function (notificationId, userId) {
  return this.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

// Static method to delete all notifications for a user
notificationSchema.statics.deleteAllForUser = function (userId) {
  return this.deleteMany({ recipient: userId });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
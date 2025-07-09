const mongoose = require('mongoose');

const activitySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'updated',
        'deleted',
        'commented',
        'assigned',
        'status_changed',
        'priority_changed',
        'joined',
        'left',
        'uploaded',
        'mentioned',
        'logged_in',
        'logged_out',
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['ticket', 'project', 'team', 'user', 'comment', 'attachment'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ team: 1, createdAt: -1 });

// Static method to log activity
activitySchema.statics.logActivity = async function (data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent disrupting the main operation
    return null;
  }
};

// Static method to get recent activities for a user
activitySchema.statics.getRecentForUser = function (userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key')
    .populate('team', 'name');
};

// Static method to get recent activities for a project
activitySchema.statics.getRecentForProject = function (projectId, limit = 20) {
  return this.find({ project: projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('project', 'name key');
};

// Static method to get recent activities for a team
activitySchema.statics.getRecentForTeam = function (teamId, limit = 20) {
  return this.find({ team: teamId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('team', 'name')
    .populate('project', 'name key');
};

// Static method to get recent activities for an entity
activitySchema.statics.getRecentForEntity = function (entityType, entityId, limit = 10) {
  return this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name avatar');
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a ticket title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a ticket description'],
    },
    ticketNumber: {
      type: String,
      required: false,
      unique: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedTime: {
      type: Number, // in hours
      default: 0,
    },
    timeSpent: {
      type: Number, // in hours
      default: 0,
    },
    labels: [{
      type: String,
      trim: true,
    }],
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    history: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        action: {
          type: String,
          required: true,
        },
        field: {
          type: String,
          default: null,
        },
        oldValue: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        newValue: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for comments
ticketSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'ticket',
});

// Generate ticket number before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Get the project key
      const project = await mongoose.model('Project').findById(this.project);
      if (!project) {
        return next(new Error('Project not found'));
      }
      
      // Get the current year (YY format)
      const currentYear = new Date().getFullYear().toString().substr(-2);
      
      // Get the count of all tickets
      const count = await mongoose.model('Ticket').countDocuments();
      
      // Generate ticket number (e.g., TICK230001 for the first ticket in 2023)
      this.ticketNumber = `TICK${currentYear}${(count + 1).toString().padStart(4, '0')}`;
      console.log("Ticket number generated:", this.ticketNumber);

      // Add creation to history
      this.history.push({
        user: this.reporter,
        action: 'created',
      });

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to add a comment to the ticket
ticketSchema.methods.addComment = async function (userId, content) {
  const Comment = mongoose.model('Comment');
  const comment = new Comment({
    ticket: this._id,
    user: userId,
    content,
  });

  await comment.save();

  // Add to history
  this.history.push({
    user: userId,
    action: 'commented',
  });

  return this.save();
};

// Method to update ticket status
ticketSchema.methods.updateStatus = function (userId, newStatus) {
  const oldStatus = this.status;
  this.status = newStatus;

  // Add to history
  this.history.push({
    user: userId,
    action: 'updated',
    field: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
  });

  return this.save();
};

// Method to assign ticket to a user
ticketSchema.methods.assignTo = function (userId, assigneeId) {
  const oldAssignee = this.assignee ? this.assignee.toString() : null;
  this.assignee = assigneeId || null;

  const entry = {
  user: userId,
  action: 'updated',
  field: 'assignee',
  oldValue: oldAssignee || null,
  newValue: assigneeId || null,
  };
  
  console.log('Adding to history:', entry);
  // Add to history
  this.history.push(entry);

  return this.save();
};

// Method to add a watcher
ticketSchema.methods.addWatcher = function (userId) {
  if (!this.watchers.includes(userId)) {
    this.watchers.push(userId);
  }
  return this.save();
};

// Method to remove a watcher
ticketSchema.methods.removeWatcher = function (userId) {
  this.watchers = this.watchers.filter(
    (watcher) => watcher.toString() !== userId.toString()
  );
  return this.save();
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
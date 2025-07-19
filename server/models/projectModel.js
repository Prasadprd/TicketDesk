const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a project description'],
    },
    key: {
      type: String,
      required: [true, 'Please add a project key'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [2, 'Project key must be at least 2 characters'],
      maxlength: [10, 'Project key must be at most 10 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'manager', 'developer', 'submitter'],
          default: 'developer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    category: {
      type: String,
      enum: ['software', 'business', 'marketing', 'design', 'support'],
      default: 'software',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    ticketTypes: [
      {
        name: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          default: 'task',
        },
        color: {
          type: String,
          default: '#4299E1',
        },
      },
    ],
    ticketStatuses: [
      {
        name: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          default: '#4299E1',
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    ticketPriorities: [
      {
        name: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          default: '#4299E1',
        },
        order: {
          type: Number,
          default: 0,
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

// Virtual for ticket count
projectSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Method to check if user is a member of the project
projectSchema.methods.isMember = function (userId) {
  return this.members.some((member) => member.user.toString() === userId.toString());
};

// Method to check if user is an admin of the project
projectSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() && member.role === 'admin'
  );
};

// Method to add a member to the project
projectSchema.methods.addMember = function (userId, role = 'developer') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role,
      joinedAt: Date.now(),
    });
  }
  return this.save();
};

// Method to remove a member from the project
projectSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update a member's role
projectSchema.methods.updateMemberRole = function (userId, newRole) {
  const memberIndex = this.members.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex !== -1) {
    this.members[memberIndex].role = newRole;
    return this.save();
  }

  return this;
};

// Add default ticket types, statuses, and priorities on project creation
projectSchema.pre('save', function (next) {
  if (this.isNew) {
    // Default ticket types if none provided
    if (!this.ticketTypes || this.ticketTypes.length === 0) {
      this.ticketTypes = [
        { name: 'Bug', icon: 'bug', color: '#E53E3E' },
        { name: 'Feature', icon: 'star', color: '#38A169' },
        { name: 'Task', icon: 'check-circle', color: '#4299E1' },
        { name: 'Epic', icon: 'lightning', color: '#805AD5' },
      ];
    }

    // Default ticket statuses if none provided
    if (!this.ticketStatuses || this.ticketStatuses.length === 0) {
      this.ticketStatuses = [
        { name: 'To Do', color: '#718096', order: 0 },
        { name: 'In Progress', color: '#4299E1', order: 1 },
        { name: 'Review', color: '#805AD5', order: 2 },
        { name: 'Done', color: '#38A169', order: 3 },
      ];
    }

    // Default ticket priorities if none provided
    if (!this.ticketPriorities || this.ticketPriorities.length === 0) {
      this.ticketPriorities = [
        { name: 'Low', color: '#38A169', order: 0 },
        { name: 'Medium', color: '#4299E1', order: 1 },
        { name: 'High', color: '#DD6B20', order: 2 },
        { name: 'Critical', color: '#E53E3E', order: 3 },
      ];
    }
  }

  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
const mongoose = require('mongoose');

const teamSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a team name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
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
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual for project count
teamSchema.virtual('projectCount').get(function () {
  return this.projects.length;
});

// Method to check if user is a member of the team
teamSchema.methods.isMember = function (userId) {
  return this.members.some((member) => member.user.toString() === userId.toString());
};

// Method to check if user is an admin of the team
teamSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() && member.role === 'admin'
  );
};

// Method to add a member to the team
teamSchema.methods.addMember = function (userId, role = 'developer') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role,
      joinedAt: Date.now(),
    });
  }
  return this.save();
};

// Method to remove a member from the team
teamSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update a member's role
teamSchema.methods.updateMemberRole = function (userId, newRole) {
  const memberIndex = this.members.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex !== -1) {
    this.members[memberIndex].role = newRole;
    return this.save();
  }

  return this;
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
const mongoose = require('mongoose');

const commentSchema = mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please add a comment'],
    },
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
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: {
          type: String,
          required: true,
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to edit a comment
commentSchema.methods.edit = function (newContent) {
  // Add current content to edit history
  this.editHistory.push({
    content: this.content,
    editedAt: Date.now(),
  });

  // Update content and mark as edited
  this.content = newContent;
  this.isEdited = true;

  return this.save();
};

// Method to add an attachment
commentSchema.methods.addAttachment = function (attachment) {
  this.attachments.push(attachment);
  return this.save();
};

// Method to remove an attachment
commentSchema.methods.removeAttachment = function (attachmentId) {
  this.attachments = this.attachments.filter(
    (attachment) => attachment._id.toString() !== attachmentId.toString()
  );
  return this.save();
};

// Method to add a mention
commentSchema.methods.addMention = function (userId) {
  if (!this.mentions.includes(userId)) {
    this.mentions.push(userId);
  }
  return this.save();
};

// Parse mentions from content and add to mentions array
commentSchema.pre('save', function (next) {
  // If content is modified, parse mentions
  if (this.isModified('content')) {
    // Extract mentions from content (e.g., @username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1]);
    }

    // TODO: Resolve usernames to user IDs and add to mentions array
    // This would require an async operation to look up users by username
    // For now, we'll just leave this as a placeholder
  }

  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
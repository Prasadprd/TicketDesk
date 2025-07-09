const express = require('express');
const router = express.Router();
const {
  createComment,
  getTicketComments,
  getCommentById,
  updateComment,
  deleteComment,
  addAttachment,
  removeAttachment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

// Validation rules
const commentValidationRules = [
  body('ticket').notEmpty().withMessage('Ticket ID is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

const commentUpdateValidationRules = [
  body('content').notEmpty().withMessage('Content is required'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

const attachmentValidationRules = [
  body('name').notEmpty().withMessage('Attachment name is required'),
  body('url').notEmpty().isURL().withMessage('Valid URL is required'),
  body('size').optional().isNumeric().withMessage('Size must be a number'),
  body('type').optional(),
];

// Routes
router.post('/', protect, validate(commentValidationRules), createComment);

router.get('/ticket/:ticketId', protect, getTicketComments);

router
  .route('/:id')
  .get(protect, getCommentById)
  .put(protect, validate(commentUpdateValidationRules), updateComment)
  .delete(protect, deleteComment);

router.post(
  '/:id/attachments',
  protect,
  validate(attachmentValidationRules),
  addAttachment
);

router.delete('/:id/attachments/:attachmentId', protect, removeAttachment);

module.exports = router;
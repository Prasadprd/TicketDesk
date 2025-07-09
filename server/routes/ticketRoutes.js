const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  updateTicketStatus,
  addWatcher,
  removeWatcher,
  getTicketHistory,
  addAttachment,
  removeAttachment,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

// Validation rules
const ticketValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('project').notEmpty().withMessage('Project is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('priority').notEmpty().withMessage('Priority is required'),
  body('status').notEmpty().withMessage('Status is required'),
  body('assignee').optional(),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedTime').optional().isNumeric().withMessage('Estimated time must be a number'),
  body('labels').optional().isArray().withMessage('Labels must be an array'),
];

const assigneeValidationRules = [
  body('assigneeId').notEmpty().withMessage('Assignee ID is required'),
];

const statusValidationRules = [
  body('status').notEmpty().withMessage('Status is required'),
];

const attachmentValidationRules = [
  body('name').notEmpty().withMessage('Attachment name is required'),
  body('url').notEmpty().isURL().withMessage('Valid URL is required'),
  body('size').optional().isNumeric().withMessage('Size must be a number'),
  body('type').optional(),
];

// Routes
router
  .route('/')
  .post(protect, validate(ticketValidationRules), createTicket)
  .get(protect, getTickets);

router
  .route('/:id')
  .get(protect, getTicketById)
  .put(protect, validate(ticketValidationRules), updateTicket)
  .delete(protect, deleteTicket);

router.put(
  '/:id/assign',
  protect,
  validate(assigneeValidationRules),
  assignTicket
);

router.put(
  '/:id/status',
  protect,
  validate(statusValidationRules),
  updateTicketStatus
);

router.post('/:id/watchers', protect, addWatcher);
router.delete('/:id/watchers/:userId', protect, removeWatcher);

router.get('/:id/history', protect, getTicketHistory);

router.post(
  '/:id/attachments',
  protect,
  validate(attachmentValidationRules),
  addAttachment
);

router.delete('/:id/attachments/:attachmentId', protect, removeAttachment);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
  getProjectActivity,
  updateTicketTypes,
  updateTicketStatuses,
  updateTicketPriorities,
  getProjectStats,
  getProjectTickets,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

// Validation rules
const projectValidationRules = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional(),
  body('category').optional(),
  body('status')
    .optional()
    .isIn(['active', 'archived', 'completed'])
    .withMessage('Status must be active, archived, or completed'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
];

const memberValidationRules = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role')
    .optional()
    .isIn(['viewer', 'member', 'admin'])
    .withMessage('Role must be viewer, member, or admin'),
];

const roleValidationRules = [
  body('role')
    .notEmpty()
    .isIn(['viewer', 'member', 'admin'])
    .withMessage('Role must be viewer, member, or admin'),
];

const ticketTypesValidationRules = [
  body().isArray().withMessage('Ticket types must be an array'),
  body('*.name').notEmpty().withMessage('Type name is required'),
  body('*.icon').optional(),
  body('*.color').optional(),
  body('*.description').optional(),
];

const ticketStatusesValidationRules = [
  body().isArray().withMessage('Ticket statuses must be an array'),
  body('*.name').notEmpty().withMessage('Status name is required'),
  body('*.category')
    .notEmpty()
    .isIn(['todo', 'inprogress', 'done'])
    .withMessage('Status category must be todo, inprogress, or done'),
  body('*.color').optional(),
  body('*.description').optional(),
];

const ticketPrioritiesValidationRules = [
  body().isArray().withMessage('Ticket priorities must be an array'),
  body('*.name').notEmpty().withMessage('Priority name is required'),
  body('*.level')
    .notEmpty()
    .isInt({ min: 0 })
    .withMessage('Priority level must be a non-negative integer'),
  body('*.color').optional(),
  body('*.icon').optional(),
];

// Routes
router
  .route('/')
  .post(protect, authorize(roles = ['admin', 'developer']), validate(projectValidationRules), createProject)
  .get(protect, getProjects);

router
  .route('/:id')
  .get(protect, getProjectById)
  .put(
    protect,
    authorize('project', 'admin'),
    validate(projectValidationRules),
    updateProject
  )
  .delete(protect, authorize('project', 'admin'), deleteProject);

router.get('/:id/activity', protect, getProjectActivity);

router.post(
  '/:id/members',
  protect,
  authorize('project', 'admin'),
  validate(memberValidationRules),
  addProjectMember
);

router.delete(
  '/:id/members/:userId',
  protect,
  authorize('project', 'admin'),
  removeProjectMember
);

router.put(
  '/:id/members/:userId/role',
  protect,
  authorize('project', 'admin'),
  validate(roleValidationRules),
  updateMemberRole
);

router.put(
  '/:id/ticket-types',
  protect,
  authorize('project', 'admin'),
  validate(ticketTypesValidationRules),
  updateTicketTypes
);

router.put(
  '/:id/ticket-statuses',
  protect,
  authorize('project', 'admin'),
  validate(ticketStatusesValidationRules),
  updateTicketStatuses
);

router.put(
  '/:id/ticket-priorities',
  protect,
  authorize('project', 'admin'),
  validate(ticketPrioritiesValidationRules),
  updateTicketPriorities
);

router.get('/:id/stats', protect, getProjectStats);
router.get('/:id/tickets', protect, getProjectTickets);

module.exports = router;
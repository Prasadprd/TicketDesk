const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  getTeamActivity,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body, param } = require('express-validator');

// Validation rules
const teamValidationRules = [
  body('name').notEmpty().withMessage('Team name is required'),
  body('description').optional(),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

const memberValidationRules = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role')
    .optional()
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin'),
];

const roleValidationRules = [
  body('role')
    .notEmpty()
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin'),
];

// Routes
router
  .route('/')
  .post(protect, validate(teamValidationRules), createTeam)
  .get(protect, getTeams);

router
  .route('/:id')
  .get(protect, getTeamById)
  .put(
    protect,
    authorize('team', 'admin'),
    validate(teamValidationRules),
    updateTeam
  )
  .delete(protect, authorize('team', 'admin'), deleteTeam);

router.get('/:id/activity', protect, getTeamActivity);

router.post(
  '/:id/members',
  protect,
  authorize('team', 'admin'),
  validate(memberValidationRules),
  addTeamMember
);

router.delete(
  '/:id/members/:userId',
  protect,
  authorize('team', 'admin'),
  removeTeamMember
);

router.put(
  '/:id/members/:userId/role',
  protect,
  authorize('team', 'admin'),
  validate(roleValidationRules),
  updateMemberRole
);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getUserActivity,
  searchUsers,
} = require('../controllers/userController');


const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { body } = require('express-validator');

// Validation rules
const userValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidationRules = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const profileUpdateValidationRules = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please include a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('bio').optional(),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

// Routes
router
  .route('/')
  .post(validate(userValidationRules), registerUser)
  .get(protect, admin, getUsers);

router.post('/login', validate(loginValidationRules), loginUser);

// Search users by name (for ticket assignment)
router.get('/search', protect, searchUsers);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validate(profileUpdateValidationRules), updateUserProfile);

router.get('/activity', protect, (req, res) => {
  req.params.userId = req.user._id;
  getUserActivity(req, res);
});

router.get('/activity/:userId', protect, getUserActivity);

router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, getUserById)
  .put(
    protect,
    admin,
    validate(profileUpdateValidationRules),
    updateUser
  );

module.exports = router;
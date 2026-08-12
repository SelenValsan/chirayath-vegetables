const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { success, ApiError } = require('../utils/apiResponse');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError('Name, email and password are required', 400);
  }
  if (password.length < 6) {
    throw new ApiError('Password must be at least 6 characters', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password, role: role || 'owner' });
  const token = signToken(user._id);

  return success(res, { user: user.toSafeObject(), token }, 'Account created successfully', 201);
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid email or password', 401);
  }

  const token = signToken(user._id);
  return success(res, { user: user.toSafeObject(), token }, 'Logged in successfully');
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user.toSafeObject() }, 'Current user fetched');
});

module.exports = { register, login, getMe };

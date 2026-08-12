const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiResponse');
const User = require('../models/User');

// Verifies the JWT sent in the Authorization header and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError('Not authorized, no token provided', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError('Not authorized, user no longer exists', 401);
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. authorize('owner', 'admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new (require('../utils/apiResponse').ApiError)('Not authorized to perform this action', 403));
  }
  next();
};

module.exports = { protect, authorize };

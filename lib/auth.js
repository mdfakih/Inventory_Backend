const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Get current user from request
const getCurrentUser = (req) => {
  try {
    const token =
      req.cookies?.authToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Get auth user (alias for getCurrentUser)
const getAuthUser = (req) => {
  return getCurrentUser(req);
};

// Require authentication middleware
const requireAuth = (req, res, next) => {
  const user = getCurrentUser(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  req.user = user;
  next();
};

// Require specific role middleware
const requireRole = (req, roles) => {
  const user = getCurrentUser(req);

  if (!user) {
    throw new Error('Not authenticated');
  }

  if (!roles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  req.user = user;
  return true;
};

// Generate random password
const generateRandomPassword = (length = 8) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getCurrentUser,
  getAuthUser,
  requireAuth,
  requireRole,
  generateRandomPassword,
};

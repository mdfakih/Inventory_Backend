const jwt = require('jsonwebtoken');

// Set authentication cookie
const setAuthCookie = (res, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Clear authentication cookie
const clearAuthCookie = (res) => {
  res.clearCookie('authToken');
};

// Generate token (re-export from auth.js)
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = {
  setAuthCookie,
  clearAuthCookie,
  generateToken,
};

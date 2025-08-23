const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const User = require('../models/User');
const {
  comparePassword,
  generateToken,
  getCurrentUser,
} = require('../lib/auth');
const { setAuthCookie, clearAuthCookie } = require('../lib/jwt');

// Login route
router.post('/login', async (req, res) => {
  try {
    await dbConnect();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact administrator.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Create response
    const response = {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };

    // Set auth cookie
    setAuthCookie(res, token);

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const response = {
      success: true,
      message: 'Logout successful',
    };

    // Clear auth cookie
    clearAuthCookie(res);

    res.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await dbConnect();

    const userData = await User.findById(user.userId).select('-password');
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: userData._id,
        email: userData.email,
        role: userData.role,
        name: userData.name,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    await dbConnect();

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    // Check if user is blocked
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact administrator.',
      });
    }

    // Update password reset request
    user.passwordResetRequest = {
      requested: true,
      requestedAt: new Date(),
      approved: false,
      approvedAt: null,
      approvedBy: null,
    };

    await user.save();

    res.json({
      success: true,
      message: 'Password reset request submitted successfully',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
    });
  }
});

// Password reset requests route (admin only)
router.get('/password-reset-requests', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view password reset requests',
      });
    }

    await dbConnect();

    const users = await User.find({
      'passwordResetRequest.requested': true,
      'passwordResetRequest.approved': false,
    }).select('name email passwordResetRequest');

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get password reset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve password reset request (admin only)
router.post('/password-reset-requests/:userId/approve', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can approve password reset requests',
      });
    }

    await dbConnect();

    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!targetUser.passwordResetRequest.requested) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found for this user',
      });
    }

    // Update password and reset request
    targetUser.password = newPassword;
    targetUser.passwordResetRequest = {
      requested: false,
      requestedAt: null,
      approved: true,
      approvedAt: new Date(),
      approvedBy: user.userId,
    };

    await targetUser.save();

    res.json({
      success: true,
      message: 'Password reset approved successfully',
    });
  } catch (error) {
    console.error('Approve password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

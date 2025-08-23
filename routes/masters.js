const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const User = require('../models/User');
const { getCurrentUser, hashPassword } = require('../lib/auth');

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view users',
      });
    }

    await dbConnect();

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// Create new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create users',
      });
    }

    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view user details',
      });
    }

    await dbConnect();

    const { id } = req.params;
    const userData = await User.findById(id).select('-password');

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

// Update user (admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update users',
      });
    }

    const { id } = req.params;
    const { name, email, role, status } = req.body;

    await dbConnect();

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== userToUpdate.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    // Validate role
    if (role && !['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Validate status
    if (status && !['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete users',
      });
    }

    await dbConnect();

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

// Change user password (admin only)
router.post('/users/:id/change-password', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can change user passwords',
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    await dbConnect();

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    userToUpdate.password = hashedPassword;
    await userToUpdate.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
});

module.exports = router;

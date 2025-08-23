const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@inventory.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@inventory.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    await adminUser.save();

    console.log('Default admin user created successfully');
    console.log('Email: admin@inventory.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase();

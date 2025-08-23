const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
    },
    number: {
      type: String,
      required: [true, 'Design number is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for number to ensure uniqueness
designSchema.index({ number: 1 }, { unique: true });

// Index for status for faster queries
designSchema.index({ status: 1 });

module.exports = mongoose.model('Design', designSchema);

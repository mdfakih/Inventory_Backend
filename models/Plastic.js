const mongoose = require('mongoose');

const plasticSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plastic name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity must be non-negative'],
      default: 0,
    },
    unit: {
      type: String,
      enum: ['pieces', 'kg', 'grams', 'meters'],
      default: 'pieces',
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for name to ensure uniqueness
plasticSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Plastic', plasticSchema);

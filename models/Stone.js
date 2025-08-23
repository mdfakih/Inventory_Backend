const mongoose = require('mongoose');

const stoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stone name is required'],
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
      enum: ['pieces', 'kg', 'grams'],
      default: 'pieces',
    },
    weightPerPiece: {
      type: Number,
      required: [true, 'Weight per piece is required'],
      min: [0, 'Weight per piece must be positive'],
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
stoneSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Stone', stoneSchema);

const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Paper name is required'],
      trim: true,
    },
    width: {
      type: Number,
      required: [true, 'Width is required'],
      min: [0, 'Width must be positive'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity must be non-negative'],
      default: 0,
    },
    piecesPerRoll: {
      type: Number,
      required: [true, 'Pieces per roll is required'],
      min: [1, 'Pieces per roll must be positive'],
    },
    weightPerPiece: {
      type: Number,
      required: [true, 'Weight per piece is required'],
      min: [0, 'Weight per piece must be positive'],
    },
    inventoryType: {
      type: String,
      enum: ['internal', 'out'],
      default: 'internal',
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

// Compound index for name and inventoryType to ensure uniqueness
paperSchema.index({ name: 1, inventoryType: 1 }, { unique: true });

// Index for inventoryType for faster queries
paperSchema.index({ inventoryType: 1 });

// Virtual for total weight
paperSchema.virtual('totalWeight').get(function () {
  return this.quantity * this.weightPerPiece;
});

// Ensure virtual fields are serialized
paperSchema.set('toJSON', { virtuals: true });
paperSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Paper', paperSchema);

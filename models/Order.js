const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: [true, 'Design is required'],
    },
    type: {
      type: String,
      enum: ['internal', 'out'],
      required: [true, 'Order type is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    stonesUsed: [
      {
        stoneId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Stone',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0, 'Quantity must be non-negative'],
        },
      },
    ],
    paperUsed: [
      {
        paperId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Paper',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [0, 'Quantity must be non-negative'],
        },
      },
    ],

    notes: {
      type: String,
      trim: true,
    },
    calculatedWeight: {
      type: Number,
      min: [0, 'Calculated weight must be non-negative'],
    },
    finalWeight: {
      type: Number,
      min: [0, 'Final weight must be non-negative'],
    },
    weightDiscrepancy: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Index for orderNumber to ensure uniqueness
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Indexes for faster queries
orderSchema.index({ status: 1 });
orderSchema.index({ type: 1 });
orderSchema.index({ designId: 1 });
orderSchema.index({ createdAt: -1 });

// Method to calculate weight
orderSchema.methods.calculateWeight = async function () {
  let totalPaperWeight = 0;
  let totalStoneWeight = 0;

  // Calculate paper weight
  if (this.paperUsed && this.paperUsed.length > 0) {
    for (const paperUsage of this.paperUsed) {
      const paper = await mongoose.model('Paper').findById(paperUsage.paperId);
      if (paper) {
        totalPaperWeight += paper.weightPerPiece * paperUsage.quantity;
      }
    }
  }

  // Calculate stone weight
  if (this.stonesUsed && this.stonesUsed.length > 0) {
    for (const stoneUsage of this.stonesUsed) {
      const stone = await mongoose.model('Stone').findById(stoneUsage.stoneId);
      if (stone) {
        totalStoneWeight += stone.weightPerPiece * stoneUsage.quantity;
      }
    }
  }

  // Calculate total weight per piece
  const weightPerPiece = totalPaperWeight + totalStoneWeight;

  // Calculate total weight for the order
  const calculatedWeight = weightPerPiece * this.quantity;

  return {
    calculatedWeight,
    weightPerPiece,
    paperWeight: totalPaperWeight,
    stoneWeight: totalStoneWeight,
  };
};

// Method to update weight discrepancy
orderSchema.methods.updateWeightDiscrepancy = function () {
  if (this.finalWeight !== undefined && this.calculatedWeight !== undefined) {
    this.weightDiscrepancy = this.finalWeight - this.calculatedWeight;
  }
  return this.weightDiscrepancy;
};

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count of orders for today
    const todayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const todayEnd = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    const count = await this.constructor.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    });

    this.orderNumber = `ORD-${year}${month}${day}-${String(count + 1).padStart(
      3,
      '0',
    )}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

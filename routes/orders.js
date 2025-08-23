const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const Order = require('../models/Order');
const Design = require('../models/Design');
const Stone = require('../models/Stone');
const Paper = require('../models/Paper');
const { getCurrentUser } = require('../lib/auth');

// Get all orders
router.get('/', async (req, res) => {
  try {
    await dbConnect();

    const { status, type, designId } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (designId) filter.designId = designId;

    const orders = await Order.find(filter)
      .populate('designId', 'name number')
      .populate('stonesUsed.stoneId', 'name')
      .populate('paperUsed.paperId', 'name')
      .populate('receivedMaterials.stones.stoneId', 'name')
      .populate('receivedMaterials.papers.paperId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { designId, type, quantity, stonesUsed, notes, paperUsed } = req.body;

    if (!designId || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Design, type, and quantity are required',
      });
    }

    // Validate order type
    if (!['internal', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order type',
      });
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }

    // Check if design exists
    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Validate stones used
    if (stonesUsed && Array.isArray(stonesUsed)) {
      for (const stoneUsage of stonesUsed) {
        if (!stoneUsage.stoneId || !stoneUsage.quantity) {
          return res.status(400).json({
            success: false,
            message: 'Stone ID and quantity are required for stones used',
          });
        }

        const stone = await Stone.findById(stoneUsage.stoneId);
        if (!stone) {
          return res.status(404).json({
            success: false,
            message: `Stone with ID ${stoneUsage.stoneId} not found`,
          });
        }

        if (stone.quantity < stoneUsage.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for stone: ${stone.name}`,
          });
        }
      }
    }

    // Validate paper used
    if (paperUsed && Array.isArray(paperUsed)) {
      for (const paperUsage of paperUsed) {
        if (!paperUsage.paperId || !paperUsage.quantity) {
          return res.status(400).json({
            success: false,
            message: 'Paper ID and quantity are required for papers used',
          });
        }

        const paper = await Paper.findById(paperUsage.paperId);
        if (!paper) {
          return res.status(404).json({
            success: false,
            message: `Paper with ID ${paperUsage.paperId} not found`,
          });
        }

        // Calculate total available pieces for this paper
        const totalAvailablePieces = paper.quantity * paper.piecesPerRoll;

        if (totalAvailablePieces < paperUsage.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient paper pieces for: ${paper.name}. Available: ${totalAvailablePieces}, Required: ${paperUsage.quantity}`,
          });
        }
      }
    }

    const order = new Order({
      designId,
      type,
      quantity,
      stonesUsed: stonesUsed || [],
      paperUsed: paperUsed || [],
      notes,
      createdBy: user.userId,
      updatedBy: user.userId,
    });

    // Calculate weight before saving
    const weightCalculation = await order.calculateWeight();
    order.calculatedWeight = weightCalculation.calculatedWeight;

    await order.save();

    // Update inventory for stones used
    if (stonesUsed && Array.isArray(stonesUsed)) {
      for (const stoneUsage of stonesUsed) {
        await Stone.findByIdAndUpdate(stoneUsage.stoneId, {
          $inc: { quantity: -stoneUsage.quantity },
        });
      }
    }

    // Update inventory for papers used
    if (paperUsed && Array.isArray(paperUsed)) {
      for (const paperUsage of paperUsed) {
        const paper = await Paper.findById(paperUsage.paperId);
        if (paper) {
          // Calculate how many pieces we're using
          const piecesUsed = paperUsage.quantity;

          // Calculate how many rolls this represents
          const rollsUsed = Math.ceil(piecesUsed / paper.piecesPerRoll);

          // Update the quantity (rolls)
          await Paper.findByIdAndUpdate(paperUsage.paperId, {
            $inc: { quantity: -rollsUsed },
          });
        }
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('designId', 'name number')
      .populate('stonesUsed.stoneId', 'name')
      .populate('paperUsed.paperId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    await dbConnect();

    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('designId', 'name number')
      .populate('stonesUsed.stoneId', 'name')
      .populate('paperUsed.paperId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const { status, notes, finalWeight } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Validate status
    if (
      status &&
      !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Update order
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (finalWeight !== undefined) {
      updateData.finalWeight = finalWeight;
      // Calculate discrepancy
      updateData.weightDiscrepancy = finalWeight - order.calculatedWeight;
    }
    updateData.updatedBy = user.userId;

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('designId', 'name number')
      .populate('stonesUsed.stoneId', 'name')
      .populate('paperUsed.paperId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Recalculate weight for an order
router.post('/:id/recalculate-weight', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Recalculate weight
    const weightCalculation = await order.calculateWeight();
    order.calculatedWeight = weightCalculation.calculatedWeight;

    // Update discrepancy if final weight exists
    if (order.finalWeight !== undefined) {
      order.weightDiscrepancy = order.finalWeight - order.calculatedWeight;
    }

    order.updatedBy = user.userId;
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('designId', 'name number')
      .populate('stonesUsed.stoneId', 'name')
      .populate('paperUsed.paperId', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.json({
      success: true,
      message: 'Weight recalculated successfully',
      data: {
        order: populatedOrder,
        weightCalculation,
      },
    });
  } catch (error) {
    console.error('Recalculate weight error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can delete orders
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete orders',
      });
    }

    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Restore inventory for stones used
    if (order.stonesUsed && Array.isArray(order.stonesUsed)) {
      for (const stoneUsage of order.stonesUsed) {
        await Stone.findByIdAndUpdate(stoneUsage.stoneId, {
          $inc: { quantity: stoneUsage.quantity },
        });
      }
    }

    // Restore inventory for papers used
    if (order.paperUsed && Array.isArray(order.paperUsed)) {
      for (const paperUsage of order.paperUsed) {
        const paper = await Paper.findById(paperUsage.paperId);
        if (paper) {
          // Calculate how many rolls to restore
          const rollsToRestore = Math.ceil(
            paperUsage.quantity / paper.piecesPerRoll,
          );

          await Paper.findByIdAndUpdate(paperUsage.paperId, {
            $inc: { quantity: rollsToRestore },
          });
        }
      }
    }

    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

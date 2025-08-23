const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const Paper = require('../models/Paper');
const Plastic = require('../models/Plastic');
const Stone = require('../models/Stone');
const Tape = require('../models/Tape');
const { getCurrentUser, requireRole } = require('../lib/auth');

// Paper routes
router.get('/paper', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Database configuration error',
      });
    }

    await dbConnect();

    const type = req.query.type || 'internal';

    // Validate inventory type
    if (!['internal', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory type',
      });
    }

    const papers = await Paper.find({ inventoryType: type }).sort({ width: 1 });

    res.json({
      success: true,
      data: papers,
    });
  } catch (error) {
    console.error('Get papers error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return res.status(500).json({
          success: false,
          message:
            'Database connection failed. Please check if MongoDB is running.',
        });
      }
      if (error.message.includes('MONGODB_URI')) {
        return res.status(500).json({
          success: false,
          message:
            'Database configuration error. Please check environment variables.',
        });
      }
      if (error.message.includes('MongoNetworkError')) {
        return res.status(500).json({
          success: false,
          message: 'Database network error. Please check your connection.',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/paper', async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Database configuration error',
      });
    }

    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const {
      name,
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType = 'internal',
    } = req.body;

    if (
      !name ||
      !width ||
      quantity === undefined ||
      !piecesPerRoll ||
      weightPerPiece === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate inventory type
    if (!['internal', 'out'].includes(inventoryType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory type',
      });
    }

    // Validate numeric fields
    if (typeof width !== 'number' || width <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Width must be a positive number',
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    if (typeof piecesPerRoll !== 'number' || piecesPerRoll <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Pieces per roll must be a positive number',
      });
    }

    if (typeof weightPerPiece !== 'number' || weightPerPiece <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight per piece must be a positive number',
      });
    }

    // Check if paper name already exists for the same inventory type
    const existingPaper = await Paper.findOne({ name, inventoryType });
    if (existingPaper) {
      return res.status(400).json({
        success: false,
        message: 'Paper with this name already exists for this inventory type',
      });
    }

    const paper = new Paper({
      name,
      width,
      quantity,
      piecesPerRoll,
      weightPerPiece,
      inventoryType,
      updatedBy: user.userId,
    });

    await paper.save();

    res.json({
      success: true,
      message: 'Paper created successfully',
      data: paper,
    });
  } catch (error) {
    console.error('Create paper error:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return res.status(500).json({
          success: false,
          message:
            'Database connection failed. Please check if MongoDB is running.',
        });
      }
      if (error.message.includes('MONGODB_URI')) {
        return res.status(500).json({
          success: false,
          message:
            'Database configuration error. Please check environment variables.',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/paper/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can edit master data',
      });
    }

    const { name, width, piecesPerRoll, weightPerPiece } = req.body;

    if (!name || !width || !piecesPerRoll || weightPerPiece === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Validate numeric fields
    if (typeof width !== 'number' || width <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Width must be a positive number',
      });
    }

    if (typeof piecesPerRoll !== 'number' || piecesPerRoll <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Pieces per roll must be a positive number',
      });
    }

    if (typeof weightPerPiece !== 'number' || weightPerPiece <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight per piece must be a positive number',
      });
    }

    const { id } = req.params;
    const paper = await Paper.findById(id);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found',
      });
    }

    // Check if name already exists for the same inventory type (excluding current paper)
    const existingPaper = await Paper.findOne({
      name,
      inventoryType: paper.inventoryType,
      _id: { $ne: id },
    });
    if (existingPaper) {
      return res.status(400).json({
        success: false,
        message: 'Paper with this name already exists for this inventory type',
      });
    }

    // Update the paper
    const updatedPaper = await Paper.findByIdAndUpdate(
      id,
      {
        name,
        width,
        piecesPerRoll,
        weightPerPiece,
        updatedBy: user.userId,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: 'Paper updated successfully',
      data: updatedPaper,
    });
  } catch (error) {
    console.error('Update paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/paper/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete master data',
      });
    }

    const { id } = req.params;
    const paper = await Paper.findById(id);
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found',
      });
    }

    // Check if paper has quantity > 0
    if (paper.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paper with existing stock',
      });
    }

    await Paper.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  } catch (error) {
    console.error('Delete paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Stone routes
router.get('/stones', async (req, res) => {
  try {
    await dbConnect();
    const stones = await Stone.find({}).sort({ name: 1 });
    res.json({
      success: true,
      data: stones,
    });
  } catch (error) {
    console.error('Get stones error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/stones', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { name, quantity, unit, weightPerPiece, description } = req.body;

    if (!name || quantity === undefined || weightPerPiece === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, quantity, and weight per piece are required',
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    if (typeof weightPerPiece !== 'number' || weightPerPiece <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight per piece must be a positive number',
      });
    }

    // Check if stone name already exists
    const existingStone = await Stone.findOne({ name });
    if (existingStone) {
      return res.status(400).json({
        success: false,
        message: 'Stone with this name already exists',
      });
    }

    const stone = new Stone({
      name,
      quantity,
      unit: unit || 'pieces',
      weightPerPiece,
      description,
      updatedBy: user.userId,
    });

    await stone.save();

    res.json({
      success: true,
      message: 'Stone created successfully',
      data: stone,
    });
  } catch (error) {
    console.error('Create stone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/stones/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can edit master data',
      });
    }

    const { name, unit, weightPerPiece, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (
      weightPerPiece !== undefined &&
      (typeof weightPerPiece !== 'number' || weightPerPiece <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Weight per piece must be a positive number',
      });
    }

    const { id } = req.params;
    const stone = await Stone.findById(id);
    if (!stone) {
      return res.status(404).json({
        success: false,
        message: 'Stone not found',
      });
    }

    // Check if name already exists (excluding current stone)
    const existingStone = await Stone.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingStone) {
      return res.status(400).json({
        success: false,
        message: 'Stone with this name already exists',
      });
    }

    // Update the stone
    const updateData = {
      name,
      unit: unit || stone.unit,
      description,
      updatedBy: user.userId,
    };

    if (weightPerPiece !== undefined) {
      updateData.weightPerPiece = weightPerPiece;
    }

    const updatedStone = await Stone.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: 'Stone updated successfully',
      data: updatedStone,
    });
  } catch (error) {
    console.error('Update stone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/stones/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete master data',
      });
    }

    const { id } = req.params;
    const stone = await Stone.findById(id);
    if (!stone) {
      return res.status(404).json({
        success: false,
        message: 'Stone not found',
      });
    }

    // Check if stone has quantity > 0
    if (stone.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete stone with existing stock',
      });
    }

    await Stone.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Stone deleted successfully',
    });
  } catch (error) {
    console.error('Delete stone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Plastic routes
router.get('/plastic', async (req, res) => {
  try {
    await dbConnect();
    const plastics = await Plastic.find({}).sort({ name: 1 });
    res.json({
      success: true,
      data: plastics,
    });
  } catch (error) {
    console.error('Get plastics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/plastic', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { name, quantity, unit, description } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and quantity are required',
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    // Check if plastic name already exists
    const existingPlastic = await Plastic.findOne({ name });
    if (existingPlastic) {
      return res.status(400).json({
        success: false,
        message: 'Plastic with this name already exists',
      });
    }

    const plastic = new Plastic({
      name,
      quantity,
      unit: unit || 'pieces',
      description,
      updatedBy: user.userId,
    });

    await plastic.save();

    res.json({
      success: true,
      message: 'Plastic created successfully',
      data: plastic,
    });
  } catch (error) {
    console.error('Create plastic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/plastic/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can edit master data',
      });
    }

    const { name, unit, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const { id } = req.params;
    const plastic = await Plastic.findById(id);
    if (!plastic) {
      return res.status(404).json({
        success: false,
        message: 'Plastic not found',
      });
    }

    // Check if name already exists (excluding current plastic)
    const existingPlastic = await Plastic.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingPlastic) {
      return res.status(400).json({
        success: false,
        message: 'Plastic with this name already exists',
      });
    }

    // Update the plastic
    const updatedPlastic = await Plastic.findByIdAndUpdate(
      id,
      {
        name,
        unit: unit || plastic.unit,
        description,
        updatedBy: user.userId,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: 'Plastic updated successfully',
      data: updatedPlastic,
    });
  } catch (error) {
    console.error('Update plastic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/plastic/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete master data',
      });
    }

    const { id } = req.params;
    const plastic = await Plastic.findById(id);
    if (!plastic) {
      return res.status(404).json({
        success: false,
        message: 'Plastic not found',
      });
    }

    // Check if plastic has quantity > 0
    if (plastic.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plastic with existing stock',
      });
    }

    await Plastic.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Plastic deleted successfully',
    });
  } catch (error) {
    console.error('Delete plastic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Tape routes
router.get('/tape', async (req, res) => {
  try {
    await dbConnect();
    const tapes = await Tape.find({}).sort({ name: 1 });
    res.json({
      success: true,
      data: tapes,
    });
  } catch (error) {
    console.error('Get tapes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.post('/tape', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { name, quantity, unit, description } = req.body;

    if (!name || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name and quantity are required',
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number',
      });
    }

    // Check if tape name already exists
    const existingTape = await Tape.findOne({ name });
    if (existingTape) {
      return res.status(400).json({
        success: false,
        message: 'Tape with this name already exists',
      });
    }

    const tape = new Tape({
      name,
      quantity,
      unit: unit || 'pieces',
      description,
      updatedBy: user.userId,
    });

    await tape.save();

    res.json({
      success: true,
      message: 'Tape created successfully',
      data: tape,
    });
  } catch (error) {
    console.error('Create tape error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.put('/tape/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can edit master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can edit master data',
      });
    }

    const { name, unit, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const { id } = req.params;
    const tape = await Tape.findById(id);
    if (!tape) {
      return res.status(404).json({
        success: false,
        message: 'Tape not found',
      });
    }

    // Check if name already exists (excluding current tape)
    const existingTape = await Tape.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingTape) {
      return res.status(400).json({
        success: false,
        message: 'Tape with this name already exists',
      });
    }

    // Update the tape
    const updatedTape = await Tape.findByIdAndUpdate(
      id,
      {
        name,
        unit: unit || tape.unit,
        description,
        updatedBy: user.userId,
      },
      { new: true },
    );

    res.json({
      success: true,
      message: 'Tape updated successfully',
      data: updatedTape,
    });
  } catch (error) {
    console.error('Update tape error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/tape/:id', async (req, res) => {
  try {
    await dbConnect();

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Only admin can delete master data
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete master data',
      });
    }

    const { id } = req.params;
    const tape = await Tape.findById(id);
    if (!tape) {
      return res.status(404).json({
        success: false,
        message: 'Tape not found',
      });
    }

    // Check if tape has quantity > 0
    if (tape.quantity > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tape with existing stock',
      });
    }

    await Tape.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Tape deleted successfully',
    });
  } catch (error) {
    console.error('Delete tape error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

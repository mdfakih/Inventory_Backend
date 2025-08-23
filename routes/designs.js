const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const Design = require('../models/Design');
const { getCurrentUser } = require('../lib/auth');

// Get all designs
router.get('/', async (req, res) => {
  try {
    await dbConnect();

    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    const designs = await Design.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: designs,
    });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create new design
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

    const { name, number, description, imageUrl } = req.body;

    if (!name || !number) {
      return res.status(400).json({
        success: false,
        message: 'Name and number are required',
      });
    }

    // Check if design number already exists
    const existingDesign = await Design.findOne({ number });
    if (existingDesign) {
      return res.status(400).json({
        success: false,
        message: 'Design with this number already exists',
      });
    }

    const design = new Design({
      name,
      number,
      description,
      imageUrl,
      createdBy: user.userId,
    });

    await design.save();

    const populatedDesign = await Design.findById(design._id).populate(
      'createdBy',
      'name email',
    );

    res.json({
      success: true,
      message: 'Design created successfully',
      data: populatedDesign,
    });
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get design by ID
router.get('/:id', async (req, res) => {
  try {
    await dbConnect();

    const { id } = req.params;
    const design = await Design.findById(id).populate(
      'createdBy',
      'name email',
    );

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    res.json({
      success: true,
      data: design,
    });
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update design
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
    const { name, number, description, imageUrl, status } = req.body;

    const design = await Design.findById(id);
    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    // Check if number already exists (excluding current design)
    if (number && number !== design.number) {
      const existingDesign = await Design.findOne({ number });
      if (existingDesign) {
        return res.status(400).json({
          success: false,
          message: 'Design with this number already exists',
        });
      }
    }

    // Validate status
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Update design
    const updateData = {};
    if (name) updateData.name = name;
    if (number) updateData.number = number;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;

    const updatedDesign = await Design.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Design updated successfully',
      data: updatedDesign,
    });
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete design
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

    // Only admin can delete designs
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete designs',
      });
    }

    const { id } = req.params;
    const design = await Design.findById(id);

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Design not found',
      });
    }

    await Design.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Design deleted successfully',
    });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const dbConnect = require('../lib/db');
const Order = require('../models/Order');
const User = require('../models/User');
const Stone = require('../models/Stone');
const Paper = require('../models/Paper');
const Plastic = require('../models/Plastic');
const Tape = require('../models/Tape');
const { getCurrentUser } = require('../lib/auth');

// Generate reports
async function generateReport(req, res) {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can generate reports',
      });
    }

    let type = 'all';
    let startDate = null;
    let endDate = null;

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      type = req.query.type || 'all';
      startDate = req.query.startDate;
      endDate = req.query.endDate;
    } else if (req.method === 'POST') {
      type = req.body.type || 'all';
      startDate = req.body.dateRange?.startDate;
      endDate = req.body.dateRange?.endDate;
    }

    await dbConnect();

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    let reportData = {};

    switch (type) {
      case 'inventory':
        const [stones, papers, plastics, tapes] = await Promise.all([
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({}),
        ]);
        reportData = { stones, papers, plastics, tapes };
        break;

      case 'orders':
        const orders = await Order.find(dateFilter)
          .populate('designId', 'name number')
          .populate('stonesUsed.stoneId', 'name')
          .populate('paperUsed.paperId', 'name')
          .populate('receivedMaterials.stones.stoneId', 'name')
          .sort({ createdAt: -1 });
        reportData = { orders };
        break;

      case 'users':
        const users = await User.find({})
          .select('-password')
          .sort({ createdAt: -1 });
        reportData = { users };
        break;

      case 'analytics':
        const [analyticsOrders, analyticsStones, analyticsPapers] =
          await Promise.all([
            Order.find(dateFilter)
              .populate('designId', 'name')
              .populate('stonesUsed.stoneId', 'name')
              .populate('paperUsed.paperId', 'name')
              .populate('receivedMaterials.stones.stoneId', 'name'),
            Stone.find({}),
            Paper.find({}),
          ]);

        // Calculate inventory analytics
        const totalStoneQuantity = analyticsStones.reduce(
          (sum, stone) => sum + stone.quantity,
          0,
        );
        const totalPaperQuantity = analyticsPapers.reduce(
          (sum, paper) => sum + paper.quantity,
          0,
        );
        const lowStockStones = analyticsStones.filter(
          (stone) => stone.quantity < 100,
        );
        const lowStockPapers = analyticsPapers.filter(
          (paper) => paper.quantity < 10,
        );

        // Calculate order analytics
        const completedOrders = analyticsOrders.filter(
          (order) => order.status === 'completed',
        );
        const pendingOrders = analyticsOrders.filter(
          (order) => order.status === 'pending',
        );
        const internalOrders = analyticsOrders.filter(
          (order) => order.type === 'internal',
        );
        const outOrders = analyticsOrders.filter(
          (order) => order.type === 'out',
        );

        reportData = {
          orders: analyticsOrders,
          stones: analyticsStones,
          papers: analyticsPapers,
          analytics: {
            inventory: {
              totalStoneQuantity,
              totalPaperQuantity,
              lowStockStones: lowStockStones.length,
              lowStockPapers: lowStockPapers.length,
            },
            orders: {
              total: analyticsOrders.length,
              completed: completedOrders.length,
              pending: pendingOrders.length,
              internal: internalOrders.length,
              out: outOrders.length,
            },
            lowStockItems: [...lowStockStones, ...lowStockPapers],
          },
        };
        break;

      default: // 'all'
        const [
          allOrders,
          allUsers,
          allStones,
          allPapers,
          allPlastics,
          allTapes,
        ] = await Promise.all([
          Order.find(dateFilter)
            .populate('designId', 'name number')
            .populate('stonesUsed.stoneId', 'name')
            .populate('receivedMaterials.stones.stoneId', 'name'),
          User.find({}).select('-password'),
          Stone.find({}),
          Paper.find({}),
          Plastic.find({}),
          Tape.find({}),
        ]);
        reportData = {
          orders: allOrders,
          users: allUsers,
          stones: allStones,
          papers: allPapers,
          plastics: allPlastics,
          tapes: allTapes,
        };
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
    });
  }
}

// GET and POST routes for generating reports
router.get('/generate', generateReport);
router.post('/generate', generateReport);

// Export reports (placeholder for future implementation)
router.post('/export', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can export reports',
      });
    }

    const { type, format, dateRange } = req.body;

    if (!type || !format) {
      return res.status(400).json({
        success: false,
        message: 'Report type and format are required',
      });
    }

    // This is a placeholder for export functionality
    // In a real implementation, you would generate CSV, Excel, or PDF files
    res.json({
      success: true,
      message: 'Export functionality will be implemented in future versions',
      data: {
        type,
        format,
        dateRange,
        downloadUrl: null,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
    });
  }
});

// Get low stock alerts
router.get('/low-stock', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await dbConnect();

    const [stones, papers, plastics, tapes] = await Promise.all([
      Stone.find({ quantity: { $lt: 100 } }),
      Paper.find({ quantity: { $lt: 10 } }),
      Plastic.find({ quantity: { $lt: 50 } }),
      Tape.find({ quantity: { $lt: 20 } }),
    ]);

    const lowStockItems = [
      ...stones.map((item) => ({ ...item.toObject(), type: 'stone' })),
      ...papers.map((item) => ({ ...item.toObject(), type: 'paper' })),
      ...plastics.map((item) => ({ ...item.toObject(), type: 'plastic' })),
      ...tapes.map((item) => ({ ...item.toObject(), type: 'tape' })),
    ];

    res.json({
      success: true,
      data: {
        lowStockItems,
        summary: {
          stones: stones.length,
          papers: papers.length,
          plastics: plastics.length,
          tapes: tapes.length,
          total: lowStockItems.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alerts',
    });
  }
});

// Get order statistics
router.get('/order-stats', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await dbConnect();

    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }

    const orders = await Order.find(dateFilter);

    const stats = {
      total: orders.length,
      byStatus: {
        pending: orders.filter((order) => order.status === 'pending').length,
        in_progress: orders.filter((order) => order.status === 'in_progress')
          .length,
        completed: orders.filter((order) => order.status === 'completed')
          .length,
        cancelled: orders.filter((order) => order.status === 'cancelled')
          .length,
      },
      byType: {
        internal: orders.filter((order) => order.type === 'internal').length,
        out: orders.filter((order) => order.type === 'out').length,
      },
      totalQuantity: orders.reduce((sum, order) => sum + order.quantity, 0),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics',
    });
  }
});

module.exports = router;

require('dotenv').config();
const mongoose = require('mongoose');
const dbConnect = require('../lib/db');
const Order = require('../models/Order');
const Paper = require('../models/Paper');
const Stone = require('../models/Stone');

async function recalculateOrderWeights() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get all orders
    const orders = await Order.find({});

    if (orders.length === 0) {
      console.log('No orders found');
      return;
    }

    console.log(`Found ${orders.length} orders to recalculate`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        console.log(`Processing order: ${order.orderNumber || order._id}`);

        // Check if order has valid data for weight calculation
        if (!order.quantity || order.quantity <= 0) {
          console.log(
            `  - Skipping order: Invalid quantity (${order.quantity})`,
          );
          skippedCount++;
          continue;
        }

        // Check if order has stones or papers used
        const hasStonesUsed = order.stonesUsed && order.stonesUsed.length > 0;
        const hasPapersUsed = order.paperUsed && order.paperUsed.length > 0;

        if (!hasStonesUsed && !hasPapersUsed) {
          console.log(`  - Skipping order: No stones or papers used`);
          skippedCount++;
          continue;
        }

        // Calculate weight manually to avoid validation issues
        let totalPaperWeight = 0;
        let totalStoneWeight = 0;

        // Calculate paper weight
        if (hasPapersUsed) {
          for (const paperUsage of order.paperUsed) {
            if (paperUsage.paperId && paperUsage.quantity) {
              const paper = await Paper.findById(paperUsage.paperId);
              if (paper && paper.weightPerPiece) {
                totalPaperWeight += paper.weightPerPiece * paperUsage.quantity;
              }
            }
          }
        }

        // Calculate stone weight
        if (hasStonesUsed) {
          for (const stoneUsage of order.stonesUsed) {
            if (stoneUsage.stoneId && stoneUsage.quantity) {
              const stone = await Stone.findById(stoneUsage.stoneId);
              if (stone && stone.weightPerPiece) {
                totalStoneWeight += stone.weightPerPiece * stoneUsage.quantity;
              }
            }
          }
        }

        // Calculate total weight per piece
        const weightPerPiece = totalPaperWeight + totalStoneWeight;

        // Calculate total weight for the order
        const calculatedWeight = weightPerPiece * order.quantity;

        if (isNaN(calculatedWeight) || calculatedWeight <= 0) {
          console.log(
            `  - Skipping order: Invalid calculated weight (${calculatedWeight})`,
          );
          skippedCount++;
          continue;
        }

        // Update the order using findByIdAndUpdate to avoid validation issues
        const updateData = {
          calculatedWeight: calculatedWeight,
        };

        // Update discrepancy if final weight exists
        if (order.finalWeight !== undefined && !isNaN(order.finalWeight)) {
          updateData.weightDiscrepancy = order.finalWeight - calculatedWeight;
        }

        await Order.findByIdAndUpdate(order._id, updateData);

        console.log(`  - Calculated weight: ${calculatedWeight}`);
        console.log(`  - Weight per piece: ${weightPerPiece}`);
        console.log(`  - Paper weight: ${totalPaperWeight}`);
        console.log(`  - Stone weight: ${totalStoneWeight}`);

        successCount++;
      } catch (error) {
        console.error(
          `  - Error processing order ${order.orderNumber || order._id}:`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log('\nRecalculation completed:');
    console.log(`  - Success: ${successCount} orders`);
    console.log(`  - Skipped: ${skippedCount} orders`);
    console.log(`  - Errors: ${errorCount} orders`);
  } catch (error) {
    console.error('Recalculation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run recalculation if this script is executed directly
if (require.main === module) {
  recalculateOrderWeights();
}

module.exports = recalculateOrderWeights;

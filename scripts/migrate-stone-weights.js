require('dotenv').config();
const mongoose = require('mongoose');
const dbConnect = require('../lib/db');
const Stone = require('../models/Stone');

async function migrateStoneWeights() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get all stones that don't have weightPerPiece
    const stones = await Stone.find({ weightPerPiece: { $exists: false } });

    if (stones.length === 0) {
      console.log('No stones found without weightPerPiece field');
      return;
    }

    console.log(`Found ${stones.length} stones without weightPerPiece field`);

    // Update each stone with a default weightPerPiece value
    // You may want to adjust this default value based on your business logic
    const defaultWeightPerPiece = 1.0; // Default 1 gram per piece

    for (const stone of stones) {
      console.log(`Updating stone: ${stone.name}`);

      await Stone.findByIdAndUpdate(stone._id, {
        weightPerPiece: defaultWeightPerPiece,
      });
    }

    console.log('Migration completed successfully');
    console.log(
      `Updated ${stones.length} stones with default weightPerPiece: ${defaultWeightPerPiece}`,
    );
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateStoneWeights();
}

module.exports = migrateStoneWeights;

const mongoose = require('mongoose');

// 1. Historical Store (Cold Path): Optimized for billions of rows [cite: 25, 28]
const historySchema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true }, // vehicleId or meterId
    type: { type: String, enum: ['meter', 'vehicle'], required: true },
    kwhConsumedAc: Number,    // From Smart Meter [cite: 12]
    kwhDeliveredDc: Number,   // From EV Charger [cite: 14]
    soc: Number,              // Battery % [cite: 14]
    batteryTemp: Number,
    timestamp: { type: Date, default: Date.now, index: true }
});

// 2. Operational Store (Hot Path): For fast "Current Status" reads [cite: 24, 29]
const liveStateSchema = new mongoose.Schema({
    vehicleId: { type: String, unique: true },
    lastSoc: Number,
    lastUpdate: { type: Date, default: Date.now }
});

module.exports = {
    History: mongoose.model('History', historySchema),
    LiveState: mongoose.model('LiveState', liveStateSchema)
};
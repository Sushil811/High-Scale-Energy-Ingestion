const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { History, LiveState } = require('./models/Telemetry');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://sushilkumarprajapati689_db_user:hLH6JtmJRoIZlztW@cluster0.aclexid.mongodb.net/?appName=Cluster0/energyFleet');

// A. Polymorphic Ingestion: Handles Meter and Vehicle streams [cite: 18, 19, 20]
app.post('/api/ingest', async (req, res) => {
    try {
        const data = req.body;
        const deviceId = data.vehicleId || data.meterId;
        const type = data.vehicleId ? 'vehicle' : 'meter';

        // 1. History Path (INSERT): Build audit trail [cite: 28]
        await History.create({ ...data, deviceId, type });

        // 2. Live Path (UPSERT): Atomic update for the dashboard [cite: 29, 30]
        if (type === 'vehicle') {
            await LiveState.findOneAndUpdate(
                { vehicleId: data.vehicleId },
                { lastSoc: data.soc, lastUpdate: new Date() },
                { upsert: true }
            );
        }

        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. Analytical Endpoint: 24-hour summary [cite: 32]
app.get('/v1/analytics/performance/:vehicleId', async (req, res) => {
    const { vehicleId } = req.params;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
        // Efficiency Ratio Calculation (DC / AC) [cite: 34]
        // In a real high-scale system, we use an index to avoid full table scans [cite: 39]
        const stats = await History.aggregate([
            { $match: { deviceId: vehicleId, timestamp: { $gte: dayAgo } } },
            { $group: {
                _id: "$deviceId",
                totalAC: { $sum: "$kwhConsumedAc" },
                totalDC: { $sum: "$kwhDeliveredDc" },
                avgTemp: { $avg: "$batteryTemp" }
            }},
            { $project: {
                efficiency: { $cond: [{ $gt: ["$totalAC", 0] }, { $divide: ["$totalDC", "$totalAC"] }, 0] },
                avgTemp: 1,
                totalAC: 1,
                totalDC: 1
            }}
        ]);

        res.json(stats[0] || { message: "No data found for last 24h" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log('Backend Engine active on port 5000'));
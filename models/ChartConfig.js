const mongoose = require('mongoose');

// Create Schema
const chartConfigSchema = new mongoose.Schema(
    {
        chart: {
            type: String,
            trim: true,
        },
        config: [
            {
                line: {
                    type: Number,
                },
                color: {
                    type: String,
                },
                weight: {
                    type: String,
                },
                dashstyle: {
                    type: String,
                },
            },
            { timestamps: false },
        ],
    },
    { timestamps: false }
);

module.exports = ChartConfig = mongoose.model('chartconfig', chartConfigSchema);

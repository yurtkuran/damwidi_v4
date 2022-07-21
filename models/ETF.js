const mongoose = require('mongoose');

const ETFSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        weightType: {
            type: String,
        },
        holdings: [
            {
                stock: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'stock',
                },
                symbol: {
                    type: String,
                    trim: true,
                },
                weight: {
                    type: Number,
                },
            },
            { timestamps: true },
        ],
    },
    { timestamps: true }
);

module.exports = ETF = mongoose.model('etf', ETFSchema);

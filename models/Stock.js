const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            trim: true,
        },

        sector: {
            type: String,
            trim: true,
        },
        industry: {
            type: String,
            trim: true,
        },
        history: [
            {
                date: {
                    type: Date,
                },
                open: {
                    type: Number,
                },
                high: {
                    type: Number,
                },
                low: {
                    type: Number,
                },
                close: {
                    type: Number,
                },
            },
            { timestamps: true },
        ],
    },

    { timestamps: true }
);

module.exports = Stock = mongoose.model('stock', StockSchema);

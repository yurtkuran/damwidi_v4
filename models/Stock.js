const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            trim: true,
        },
        companyName: {
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
        website: {
            type: String,
            trim: true,
        },
        exchange: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        sharesOutstanding: {
            type: Number,
        },
        marketCap: {
            type: Number,
        },
        peRatio: {
            type: Number,
        },
        year5ChangePercent: {
            type: Number,
        },
        year2ChangePercent: {
            type: Number,
        },
        year1ChangePercent: {
            type: Number,
        },
        ytdChangePercent: {
            type: Number,
        },
        month6ChangePercent: {
            type: Number,
        },
        month3ChangePercent: {
            type: Number,
        },
        month1ChangePercent: {
            type: Number,
        },
        day30ChangePercent: {
            type: Number,
        },
        day5ChangePercent: {
            type: Number,
        },
        componentOf: [
            {
                type: String,
            },
            { _id: false },
        ],
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

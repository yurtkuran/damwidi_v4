const mongoose = require('mongoose');

const SP500Schema = new mongoose.Schema(
    {
        symbol: {
            type: String,
            trim: true,
            unique: true,
        },
        name: {
            type: String,
            trim: true,
        },
        sectorMBA: {
            type: String,
            trim: true,
        },
        sectorIEX: {
            type: String,
            trim: true,
        },
        industryIEX: {
            type: String,
            trim: true,
        },
        sharesOutstanding: {
            type: Number,
        },
        marketCap: {
            type: Number,
        },
        weight: {
            type: Number,
        },
        website: {
            type: String,
            trim: true,
        },
        exchange: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = SP500 = mongoose.model('SP500', SP500Schema);

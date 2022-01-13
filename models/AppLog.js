const mongoose = require('mongoose');

// Create Schema
const appLogSchema = new mongoose.Schema(
    {
        logDateTime: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            trim: true,
        },
        log: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

module.exports = AppLog = mongoose.model('appLog', appLogSchema);

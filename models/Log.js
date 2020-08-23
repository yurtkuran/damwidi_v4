const mongoose = require('mongoose');

// Create Schema
const logSchema = new mongoose.Schema(
    {
        _user: {
            type: mongoose.Schema.Types.ObjectId,
        },
        userID: {
            type: String,
        },
        name: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

module.exports = Log = mongoose.model('log', logSchema);

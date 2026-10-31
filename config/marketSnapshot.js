const second = 1000;
const minute = 60 * second;

module.exports = {
    additionalSymbols: ['DIA', 'QQQ', 'SPY'],
    sessionPolicies: {
        open: {
            snapshotTTL: 15 * second,
            marketStatusTTL: 30 * second,
        },
        premarket: {
            snapshotTTL: 60 * second,
            marketStatusTTL: 30 * second,
        },
        afterHours: {
            snapshotTTL: 60 * second,
            marketStatusTTL: 60 * second,
        },
        closed: {
            snapshotTTL: 15 * minute,
            marketStatusTTL: 5 * minute,
        },
        weekend: {
            snapshotTTL: 60 * minute,
            marketStatusTTL: 30 * minute,
        },
        holiday: {
            snapshotTTL: 60 * minute,
            marketStatusTTL: 30 * minute,
        },
    },
};

// bring in local dependencies
const { logTime } = require('./knowMoment');

// database models
const AppLog = require('../models/AppLog');

const writeLog = (type, log, address = '') => {
    const newLog = new AppLog({
        logDateTime: logTime(),
        type,
        log: `${logTime()}: ${type.padEnd(10, ' ')} ${address.padEnd(10, ' ')} ${log} }`,
        address,
    });

    // newLog.save((err, log) => {
    //     if (err) {
    //         console.log('Error during log save: ' + err);
    //     }
    // });
    // return;
};

module.exports = {
    writeLog,
};

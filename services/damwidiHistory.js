const Value = require('../models/Value.model');

const roundToTwoDecimals = (value) => Math.round(Number(value) * 100) / 100;

const formatDailySeries = (candles) => {
    if (candles.length === 0) {
        return [];
    }

    const dailySeries = {};

    candles.forEach((candle) => {
        dailySeries[candle.date] = {
            '1. open': roundToTwoDecimals(candle.open),
            '2. high': roundToTwoDecimals(candle.high),
            '3. low': roundToTwoDecimals(candle.low),
            '4. close': roundToTwoDecimals(candle.close),
        };
    });

    return { 'Time Series (Daily)': dailySeries };
};

const returnDamwidiOHLC = async (ValueModel = Value) => {
    const candles = await ValueModel.findAll({
        attributes: ['date', 'open', 'high', 'low', 'close'],
        order: [['date', 'DESC']],
        raw: true,
    });

    return formatDailySeries(candles);
};

module.exports = {
    formatDailySeries,
    returnDamwidiOHLC,
};

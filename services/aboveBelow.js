const chartConfig = require('../config/aboveBelowChartConfig.json');
const timeframeLengths = require('../config/aboveBelowTimeframes.json');
const marketDataRepository = require('./marketDataRepository');
const { calculateGainFactor, phpRound } = require('./marketCalculations');

const getHistoryLength = async (timeframe, repository, year) => {
    if (timeframe === 'ytd') {
        return repository.getYTDHistoryLength(year);
    }

    return timeframeLengths[timeframe];
};

const calculateCumulativeGain = (historicalData, length) => {
    const gain = [1];

    for (let index = 1; index < length; index++) {
        const dailyGain = calculateGainFactor(historicalData[index].close, historicalData[index - 1].close, 6);
        gain[index] = phpRound(gain[index - 1] * dailyGain, 4);
    }

    return gain;
};

const buildDataSet = (data, summaries, type) => {
    const dataset = [];

    for (const summary of summaries) {
        dataset.push({
            label: summary.name,
            symbol: summary.sector,
            data: data[summary.sector][type === 'rs' ? 'rs' : 'gain'],
        });

        if (summary.type === 'I' && type !== 'rs') {
            break;
        }
    }

    return dataset;
};

const getAboveBelowData = async (timeframe, dependencies = {}) => {
    const repository = dependencies.repository || marketDataRepository;
    const year = dependencies.year || new Date().getFullYear();
    const length = await getHistoryLength(timeframe, repository, year);
    const performanceRows = await repository.getAboveBelowSectors();
    const performanceData = performanceRows.reduce((result, row) => {
        result[row.sector] = row;
        return result;
    }, {});
    const sectors = Object.values(performanceData).filter(
        (row) => (row.type === 'I' && row.sector === 'SPY') || row.type === 'S'
    );
    const data = {};
    let lastHistoricalData = [];

    for (const sector of sectors) {
        const historicalData = await repository.getRecentHistory(sector.sector, length);
        lastHistoricalData = historicalData;

        if (historicalData.length >= length) {
            data[sector.sector] = {
                gain: calculateCumulativeGain(historicalData, length),
            };
        }
    }

    for (const sector of sectors) {
        if (data[sector.sector]) {
            data[sector.sector].rs = data[sector.sector].gain.map((gain, index) => phpRound(100 * (gain / data.SPY.gain[index]), 4));
        }
    }

    const labels = lastHistoricalData.slice(0, length).map((row) => row.date);
    const summaries = sectors
        .filter((sector) => data[sector.sector])
        .map((sector) => ({
            sector: sector.sector,
            name: sector.name,
            type: sector.type,
            rs: data[sector.sector].rs[length - 1],
            gain: data[sector.sector].gain[length - 1],
        }));

    const above = buildDataSet(
        data,
        [...summaries].sort((a, b) => b.gain - a.gain),
        'above'
    );
    const below = buildDataSet(
        data,
        [...summaries].sort((a, b) => a.gain - b.gain),
        'below'
    );
    const rs = buildDataSet(
        data,
        [...summaries].sort((a, b) => b.rs - a.rs),
        'rs'
    );

    return {
        labels,
        above,
        below,
        rs,
        chartConfig,
    };
};

module.exports = {
    buildDataSet,
    calculateCumulativeGain,
    getAboveBelowData,
};

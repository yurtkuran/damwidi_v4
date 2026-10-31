const marketDataRepository = require('./marketDataRepository');
const marketSnapshot = require('./marketSnapshot');

const requireNumber = (value, field) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(`Allocation data is missing ${field}`);
    }

    return number;
};

const calculateAllocation = (value, fundValue) => (fundValue === 0 ? -1 : (100 * value) / fundValue);

const getQuotePrice = (quotes, symbol) => {
    const quote = quotes.get(symbol);

    if (!quote) {
        throw new Error(`Allocation data is missing a quote for ${symbol}`);
    }

    return requireNumber(quote.latestPrice, `${symbol} latest price`);
};

const buildPositionRow = ({ data, fundValue, quotes, sector = data.symbol, symbol = data.symbol }) => {
    const shares = requireNumber(data.shares, `${symbol} shares`);
    const basis = requireNumber(data.basis, `${symbol} basis`);
    const latestPrice = getQuotePrice(quotes, symbol);
    const currentValue = shares * latestPrice;

    return {
        symbol,
        sector,
        description: data.description,
        type: data.type,
        shares,
        currentValue,
        change: shares * (latestPrice - basis),
        allocation: calculateAllocation(currentValue, fundValue),
    };
};

const addWeightFields = (row, weight, fundValue, spyCurrentValue) => {
    const weightPercent = requireNumber(weight, `${row.symbol} weight`);
    const implied = spyCurrentValue * (weightPercent / 100) + row.currentValue;

    return {
        ...row,
        weightPercent,
        impliedPercent: fundValue === 0 ? -1 : (100 * implied) / fundValue,
    };
};

const calculateFundValue = ({ baseRows, stockRows, quotes }) => {
    let currentValue = 0;

    for (const row of [...baseRows, ...stockRows]) {
        if (row.type === 'C') {
            currentValue += requireNumber(row.basis, 'CASH basis');
        } else {
            const shares = requireNumber(row.shares, `${row.symbol} shares`);
            currentValue += shares * getQuotePrice(quotes, row.symbol);
        }
    }

    return currentValue;
};

const buildAllocationData = ({ baseRows, stockMappings, stockRows, snapshot }) => {
    const quotes = snapshot.quotes;
    const fundValue = calculateFundValue({ baseRows, stockRows, quotes });
    const stockRowsBySymbol = new Map(stockRows.map((row) => [row.symbol, row]));
    const spyData = baseRows.find((row) => row.symbol === 'SPY');

    if (!spyData) {
        throw new Error('Allocation data is missing SPY');
    }

    const spyCurrentValue =
        requireNumber(spyData.shares, 'SPY shares') * getQuotePrice(quotes, 'SPY');
    const rows = [];
    let fundBasis = 0;

    for (const baseData of baseRows) {
        let row;

        if (baseData.type === 'C') {
            const basis = requireNumber(baseData.basis, 'CASH basis');
            row = {
                symbol: baseData.symbol,
                sector: baseData.symbol,
                description: baseData.description,
                type: baseData.type,
                shares: 1,
                currentValue: basis,
                change: 0,
                allocation: calculateAllocation(basis, fundValue),
            };
            fundBasis += requireNumber(baseData.shares, 'CASH shares') * basis;
        } else {
            row = buildPositionRow({ data: baseData, fundValue, quotes });
            fundBasis += requireNumber(baseData.shares, `${baseData.symbol} shares`) * requireNumber(baseData.basis, `${baseData.symbol} basis`);
        }

        if (baseData.type === 'S') {
            row = addWeightFields(row, baseData.weight, fundValue, spyCurrentValue);
        }

        rows.push(row);

        const mappings = stockMappings.filter((mapping) => mapping.sector === baseData.symbol);

        if (mappings.length === 0) {
            if (baseData.type === 'S') {
                row.type = 'Y';
            }
            continue;
        }

        let summaryCurrentValue = row.currentValue;
        let summaryChange = row.change;

        for (const mapping of mappings) {
            const stockData = stockRowsBySymbol.get(mapping.symbol);

            if (!stockData) {
                throw new Error(`Allocation data is missing stock data for ${mapping.symbol}`);
            }

            const stockRow = buildPositionRow({
                data: stockData,
                fundValue,
                quotes,
                sector: baseData.symbol,
            });
            rows.push(stockRow);
            summaryCurrentValue += stockRow.currentValue;
            summaryChange += stockRow.change;
            fundBasis +=
                requireNumber(stockData.shares, `${stockData.symbol} shares`) *
                requireNumber(stockData.basis, `${stockData.symbol} basis`);
        }

        rows.push(
            addWeightFields(
                {
                    symbol: `${baseData.symbol}_Total`,
                    sector: baseData.symbol,
                    description: baseData.name,
                    type: 'Y',
                    shares: null,
                    currentValue: summaryCurrentValue,
                    change: summaryChange,
                    allocation: calculateAllocation(summaryCurrentValue, fundValue),
                },
                baseData.weight,
                fundValue,
                spyCurrentValue
            )
        );
    }

    return {
        asOf: new Date(snapshot.fetchedAt).toISOString(),
        fund: {
            symbol: 'DAM',
            description: 'Damwidi',
            currentValue: fundValue,
            basis: fundBasis,
            change: fundValue - fundBasis,
        },
        rows,
        dataQuality: {
            complete: snapshot.complete,
            excludedSymbols: [...snapshot.excludedSymbols],
        },
    };
};

const createAllocationService = (dependencies = {}) => {
    const repository = dependencies.repository || marketDataRepository;
    const snapshotService = dependencies.snapshotService || marketSnapshot;

    const getAllocationData = async () => {
        const inputs = await repository.getAllocationInputs();
        const symbols = [
            ...new Set(
                [...inputs.baseRows, ...inputs.stockRows]
                    .filter((row) => row.type !== 'C')
                    .map((row) => row.symbol.trim().toUpperCase())
            ),
        ];
        const snapshot = await snapshotService.getMarketSnapshot({ symbols });

        return buildAllocationData({ ...inputs, snapshot });
    };

    return { getAllocationData };
};

const allocationService = createAllocationService();

module.exports = {
    buildAllocationData,
    calculateAllocation,
    createAllocationService,
    getAllocationData: allocationService.getAllocationData,
};

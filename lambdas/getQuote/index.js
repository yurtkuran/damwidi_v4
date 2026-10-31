const axios = require('axios');

const yahooChartURL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const buildResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
});

const createHandler = (httpClient = axios, now = Date.now) => async (event = {}) => {
    const start = now();
    const requestedSymbol = event.pathParameters && event.pathParameters.symbol;
    const symbol = typeof requestedSymbol === 'string' ? requestedSymbol.trim().toUpperCase() : '';

    if (!symbol) {
        return buildResponse(404, { message: 'symbol not provided' });
    }

    const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
    const response = { symbol, url };

    try {
        const yahoo = await httpClient.get(`${yahooChartURL}${encodeURIComponent(symbol)}`, {
            params: {
                interval: '1m',
                range: '1d',
            },
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0',
            },
            timeout: 10000,
        });
        const result = yahoo.data && yahoo.data.chart && yahoo.data.chart.result && yahoo.data.chart.result[0];
        const meta = result && result.meta;
        const regularMarketPrice = meta && Number(meta.regularMarketPrice);

        if (!Number.isFinite(regularMarketPrice)) {
            throw new Error('Yahoo quote did not include a current market price');
        }

        const previousCloseValue = meta.chartPreviousClose ?? meta.previousClose;
        const previousClose = Number(previousCloseValue);

        response.status = yahoo.status;
        response.regularMarketPrice = regularMarketPrice;
        response.regularMarketPreviousClose = Number.isFinite(previousClose) ? previousClose : null;
        response.regularMarketTime = meta.regularMarketTime ?? null;
        response.previousClose = response.regularMarketPreviousClose;
        response.executionTime = now() - start;
    } catch (error) {
        response.status = error.response ? error.response.status : 500;
        response.message = 'Quote retrieval failed';
        response.errorMessage = error.message;
        response.executionTime = now() - start;
    }

    return buildResponse(200, response);
};

exports.createHandler = createHandler;
exports.handler = createHandler();

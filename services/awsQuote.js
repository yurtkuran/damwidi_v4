const axios = require('axios');

const isConfigured = () => Boolean(process.env.AWS_QUOTE_URL && process.env.AWS_QUOTE_KEY);

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value === 'string') {
        value = value.replace(/[$,]/g, '');
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const quote = async (symbol, httpClient = axios) => {
    if (!isConfigured()) {
        return null;
    }

    const response = await httpClient.get(`${process.env.AWS_QUOTE_URL}${encodeURIComponent(symbol.toUpperCase())}`, {
        headers: {
            Accept: 'application/json',
            'x-api-key': process.env.AWS_QUOTE_KEY,
        },
    });
    const data = response.data || {};
    const previousClose = toNumber(data.regularMarketPreviousClose ?? data.previousClose);
    const latestPrice = toNumber(data.regularMarketPrice ?? data.currentPrice ?? data.previousClose);

    if (latestPrice === null) {
        return null;
    }

    return {
        symbol: symbol.toUpperCase(),
        latestPrice,
        previousClose,
        updated: data.regularMarketTime || null,
        source: 'yahoo',
    };
};

module.exports = {
    isConfigured,
    quote,
};

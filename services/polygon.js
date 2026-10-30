const axios = require('axios');
const dayjs = require('dayjs');
require('dotenv').config();

const baseURL = 'https://api.polygon.io/';

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const normalizeTicker = (tickerData) => {
    const currentDay = tickerData.day || {};
    const previousDay = tickerData.prevDay || {};
    const currentClose = toNumber(currentDay.c);
    const previousClose = toNumber(previousDay.c);
    const latestPrice = currentClose !== null && currentClose !== 0 ? currentClose : previousClose;
    const changePercent = toNumber(tickerData.todaysChangePerc);
    const updated = toNumber(tickerData.updated);

    return Object.freeze({
        symbol: tickerData.ticker.toUpperCase(),
        latestPrice,
        previousClose,
        change: toNumber(tickerData.todaysChange),
        changePercent: changePercent === null ? null : changePercent / 100,
        updated: updated === null ? null : updated / 1e9,
        open: toNumber(currentDay.o) || toNumber(previousDay.o),
        high: toNumber(currentDay.h) || toNumber(previousDay.h),
        low: toNumber(currentDay.l) || toNumber(previousDay.l),
        close: latestPrice,
        source: 'polygon',
    });
};

const getMarketStatus = async (httpClient = axios) => {
    const response = await httpClient.get(`${baseURL}v1/marketstatus/now`, {
        params: { apiKey: process.env.POLYGONIO_KEY },
    });

    return response.data;
};

const getBatchSnapshots = async (symbols, httpClient = axios) => {
    const requestedSymbols = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))];

    if (requestedSymbols.length === 0) {
        return new Map();
    }

    const response = await httpClient.get(`${baseURL}v2/snapshot/locale/us/markets/stocks/tickers`, {
        params: {
            apiKey: process.env.POLYGONIO_KEY,
            tickers: requestedSymbols.join(','),
        },
    });

    return new Map(
        (response.data.tickers || []).map((ticker) => {
            const normalizedTicker = normalizeTicker(ticker);
            return [normalizedTicker.symbol, normalizedTicker];
        })
    );
};


// https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/AAPL?apiKey=
const quote = async (symbol) => {
    const url = `${baseURL}v2/snapshot/locale/us/markets/stocks/tickers/${symbol.toUpperCase()}?apiKey=` + process.env.POLYGONIO_KEY;

    try {
        const res = await axios.get(url);
        const tickerData = res.data.ticker;

        // console.trace('polygon ticker data')
        // console.log({polygon: tickerData})

        const quote = {
            symbol: tickerData.ticker,
            latestPrice: tickerData.day.c != 0 ? tickerData.day.c : tickerData.prevDay.c,
            previousClose: tickerData.prevDay.c,
            change: tickerData.todaysChange,
            changePercent: tickerData.todaysChangePerc/100,
            updated: tickerData.updated / 1e9
        }
        return quote;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

// const url = `https://api.polygon.io/v3/reference/tickers/AAPL?apiKey=
const profile = async (symbol) => {
    symbol = symbol.toUpperCase();
    const url = `${baseURL}v3/reference/tickers/${symbol.toUpperCase()}?apiKey=` + process.env.POLYGONIO_KEY;
    try {
        const res = await axios.get(url);
        const data = res.data;

        // console.trace('polygon profile')
        // console.log({polygon: data})

        return {
            symbol,
            name: data?.results?.name ?? symbol,
            desc: data?.results?.description ?? '',
            source: "polygon",
            data: data.results

        };
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

module.exports = {
    getBatchSnapshots,
    getMarketStatus,
    normalizeTicker,
    quote,
    profile
};

const axios = require('axios');
const dayjs = require('dayjs');
require('dotenv').config();

const baseURL = 'https://api.polygon.io/';


// https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/AAPL?apiKey=
const quote = async (symbol) => {
    const url = `${baseURL}v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=` + process.env.POLYGONIO_KEY;

    try {
        const res = await axios.get(url);
        const tickerData = res.data.ticker;
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
        const tickerDeatil = await axios.get(url);
        const data = tickerDeatil.data;
        return {
            symbol,
            name: data?.results?.name ?? symbol,
            desc: data?.results?.description ?? '',
            source: "polygon",
            data

        };
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

module.exports = {
    quote,
    profile
};
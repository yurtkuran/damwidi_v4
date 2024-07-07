const axios = require('axios');
require('dotenv').config();

// finhub base URL
const finnhubURL = 'https://finnhub.io/api/v1/stock/';

const profile = async (symbol) => {
    symbol = symbol.toUpperCase();
    const url = finnhubURL + `profile2?symbol=${symbol}&token=` + process.env.FINNHUB_KEY;
    // https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=btijeh748v6ula7ekfr0
    try {
        const tickerDeatil = await axios.get(url);
        const data = tickerDeatil.data;
        return {
            symbol,
            name: data?.name ?? symbol,
            finnhub: data

        };    } catch (err) {
        console.log(err.message);
        return false;
    }
};

module.exports = {
    profile,
};

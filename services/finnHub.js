const axios = require('axios');
require('dotenv').config();

// finhub base URL
const finnhubURL = 'https://finnhub.io/api/v1/stock/';

const profile = async (symbol) => {
    symbol = symbol.toUpperCase();
    const url = finnhubURL + `profile2?symbol=${symbol}&token=` + process.env.FINNHUB_KEY;
    // https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=
    try {
        const response = await axios.get(url);
        const data = response.data;
        return {
            symbol,
            name: data?.name ?? symbol,
            finnhub: data
        }
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

const metrics = async (symbol) => {
    symbol = symbol.toUpperCase();
    const url = finnhubURL + `metric?symbol=${symbol}&token=` + process.env.FINNHUB_KEY;
    // https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=
    try {
        const res = await axios.get(url);
        const data = res.data;

        // console.trace('finhub')
        // console.log({finhub: data})
        return {
            symbol,
            source: "finnhub",
            data: data?.metric ?? {} 

        }
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

module.exports = {
    profile,
    metrics
};
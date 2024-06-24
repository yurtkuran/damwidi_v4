const axios = require('axios');
require('dotenv').config();

// finhub base URL
const finnhubURL = 'https://finnhub.io/api/v1/stock/';

const profile = async (symbol) => {
    const url = finnhubURL + `profile2?symbol=${symbol}&token=` + process.env.FINNHUB_KEY;
    // https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=btijeh748v6ula7ekfr0
    console.log(url)
    try {
        const finnhub = await axios.get(url);
        return finnhub.data;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

module.exports = {
    profile,
};

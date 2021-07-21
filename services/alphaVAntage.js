const axios = require('axios');
require('dotenv').config();

// IEX Cloud base URL
const alphaVantageBaseURL = 'https://www.alphavantage.co/query';

const intraday = async (symbol) => {
    const url = `${alphaVantageBaseURL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=compact&apikey=${process.env.ALPHAVANTAGE_KEY}`;

    console.log(url);

    return false;

    // try {
    //     const iex = await axios.get(url);
    //     return iex.data;
    // } catch (err) {
    //     console.log(err.message);
    //     return false;
    // }
};

module.exports = {
    intraday,
};

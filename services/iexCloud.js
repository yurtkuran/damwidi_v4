const axios = require('axios');
require('dotenv').config();

// IEX Cloud base URL
const iexBaseURL = 'https://cloud.iexapis.com/stable/';

const company = async (symbol) => {
    const url = iexBaseURL + `stock/${symbol}/company?token=` + process.env.IEXCLOUD_PUBLIC_KEY;

    try {
        const iex = await axios.get(url);
        return iex.data;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

const keyStats = async (symbol, stat = null) => {
    stat = stat !== null ? `/${stat}` : '';
    const url = iexBaseURL + `stock/${symbol}/stats${stat}?token=` + process.env.IEXCLOUD_PUBLIC_KEY;

    try {
        const iex = await axios.get(url);
        return iex.data;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

const quote = async (symbol, stat = null) => {
    stat = stat !== null ? `/${stat}` : '';
    const url = iexBaseURL + `stock/${symbol}/quote?token=` + process.env.IEXCLOUD_PUBLIC_KEY;

    try {
        const iex = await axios.get(url);
        return iex.data;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

module.exports = {
    company,
    keyStats,
    quote,
};

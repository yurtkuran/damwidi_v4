const axios = require('axios');
const dayjs = require('dayjs');
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

const quote = async (symbol) => {
    const url = iexBaseURL + `stock/${symbol}/quote?token=` + process.env.IEXCLOUD_PUBLIC_KEY;

    try {
        const iex = await axios.get(url);
        return iex.data;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

const intraDay = async (symbol) => {
    const url = iexBaseURL + `stock/${symbol}/intraday-prices?token=` + process.env.IEXCLOUD_PUBLIC_KEY;

    try {
        const iex = await axios.get(url);

        let ohlc = [];
        for (let i = 0; i < iex.data.length; i++) {
            ohlc.push([
                dayjs(`${iex.data[i].date}T${iex.data[i].minute}}`).valueOf(), // the date
                iex.data[i].open, // open
                iex.data[i].high, // high
                iex.data[i].low, // low
                iex.data[i].close, // close
            ]);
        }
        return ohlc;
    } catch (err) {
        console.log(err.message);
        return false;
    }
};

module.exports = {
    company,
    keyStats,
    quote,
    intraDay,
};

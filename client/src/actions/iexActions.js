import axios from 'axios';

// validate symbol
export const validateSymbol = async ({ symbol }) => {
    try {
        const res = await axios.get(`/api/iex/validate/${symbol}`);
        return res.data.symbol !== 'Unknown symbol' ? res.data : false;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

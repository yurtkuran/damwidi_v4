import axios from 'axios';

// validate symbol
const validateSymbol = async ({ symbol }) => {
    console.log(symbol);
    try {
        const res = await axios.get(`/api/iex/validate/${symbol}`);
        return res.data.symbol !== 'Unknown symbol' ? res.data : false;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

export default validateSymbol;

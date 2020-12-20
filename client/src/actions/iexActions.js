import axios from 'axios';

// bring in types
import { GET_IEX_USAGE, GET_IEX_DETAILS } from './types';

// get usage
export const getUsage = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/iex/usage');
        dispatch({ type: GET_IEX_USAGE, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get details
export const getDetails = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/iex/details');
        dispatch({ type: GET_IEX_DETAILS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

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

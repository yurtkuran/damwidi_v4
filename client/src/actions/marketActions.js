import axios from 'axios';

import { GET_INTRADAY, GET_KEYSTATS } from './types';

// get intraday data
export const getIntraDayData = (symbol) => async (dispatch) => {
    try {
        const res = await axios.get(`api/marketData/intraday/${symbol}`);
        dispatch({ type: GET_INTRADAY, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get keystats data
export const getKeyStats = (symbol) => async (dispatch) => {
    try {
        const res = await axios.get(`api/marketData/keystats/${symbol}`);
        dispatch({ type: GET_KEYSTATS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

import axios from 'axios';

import { GET_PROFILE, GET_QUOTE } from './types';

// get symbpl profile data
export const getProfile = (symbol) => async (dispatch) => {
    try {
        const res = await axios.get(`api/marketData/profile/${symbol}`);
        dispatch({ type: GET_PROFILE, payload: res.data });
        return res.data.status !== 'OK' ? res.data : false; 
    } catch (err) {
        console.log(err);
    }
};


// get quote data
export const getQuote = (symbol) => async (dispatch) => {
    try {
        const res = await axios.get(`api/marketData/quote/${symbol}`);
        dispatch({ type: GET_QUOTE, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

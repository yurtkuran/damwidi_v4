import axios from 'axios';

import { GET_INTRADAY, GET_KEYSTATS, GET_PROFILE, GET_QUOTE } from './types';

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

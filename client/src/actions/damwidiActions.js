import axios from 'axios';

import { GET_UNSTICK_LOG, GET_TRADE_HISTORY, GET_INTRADAY_DATA } from './types';

// get unstick log
export const getUnstick = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/unstick`);
        dispatch({ type: GET_UNSTICK_LOG, payload: Object.values(res.data) });
    } catch (err) {
        console.log(err);
    }
};

// get trade history
export const getTradeHistory = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/tradeHistory`);
        dispatch({ type: GET_TRADE_HISTORY, payload: Object.values(res.data.data) });
    } catch (err) {
        console.log(err);
    }
};

// get intraday data
export const getIntraDayData = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/intraDayData`);
        dispatch({ type: GET_INTRADAY_DATA, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

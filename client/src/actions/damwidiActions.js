import axios from 'axios';

import { GET_UNSTICK_LOG, GET_TRADE_HISTORY, GET_INTRADAY_DATA, GET_PERFORMANCE_DATA, GET_ABOVEBELOW_DATA, GET_HISTORY, RESET_DAMWIDI_LOADING } from './types';

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

// get performance data
export const getPerformanceData = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/timeframeData`);
        dispatch({ type: GET_PERFORMANCE_DATA, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get above-below data
export const getAboveBelowData = (timeframe) => async (dispatch) => {
    try {
        dispatch({ type: RESET_DAMWIDI_LOADING });

        const res = await axios.get(`/api/damwidi/aboveBelowData/${timeframe}`);
        dispatch({ type: GET_ABOVEBELOW_DATA, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get history data
export const getHistoryData = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/history`);
        dispatch({ type: GET_HISTORY, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

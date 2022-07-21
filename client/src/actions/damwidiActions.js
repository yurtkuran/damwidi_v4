import axios from 'axios';
import moment from 'moment';
import store from '../store';

import {
    GET_UNSTICK_LOG,
    GET_TRADE_HISTORY,
    GET_PERFORMANCE,
    GET_PERFORMANCE_DATA,
    GET_ABOVEBELOW_DATA,
    GET_HISTORY,
    GET_OPEN_POSITIONS,
    GET_OPEN_POSDETAIL,
    GET_ALLOCATION,
    SET_REALTIME_DATA,
    RESET_DAMWIDI_LOADING,
} from './types';

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
        console.log(res.data);
        dispatch({ type: GET_TRADE_HISTORY, payload: Object.values(res.data) });
    } catch (err) {
        console.log(err);
    }
};

// get sectors from performance table and bacth quotes
// todo
export const getPerformance = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/performance`);
        dispatch({ type: GET_PERFORMANCE, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get intraday data
// todo remove
export const getIntraDayData = () => async (dispatch) => {};

// get performance data - sector by timeframe charts
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

// get open positions
export const getOpenPositions = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/openPositions`);
        dispatch({ type: GET_OPEN_POSITIONS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get open positions with details
export const getOpenPositionsDetail = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/openPositionsDetail`);
        dispatch({ type: GET_OPEN_POSDETAIL, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get allocation data
export const getAllocation = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/allocation`);
        dispatch({ type: GET_ALLOCATION, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// update state with realtime data
// reference: https://stackoverflow.com/questions/35667249/accessing-redux-state-in-an-action-creator
export const realTimeUpdate = (prices) => (dispatch) => {
    dispatch({ type: SET_REALTIME_DATA, payload: prices });
};

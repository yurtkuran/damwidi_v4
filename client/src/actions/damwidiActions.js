import axios from 'axios';

import {
    GET_ABOVEBELOW_DATA,
    GET_ALLOCATION_DATA,
    GET_ALLOCATION_ERROR,
    GET_HISTORY,
    GET_INTRADAY_DATA,
    GET_OPEN_POSITIONS,
    GET_PERFORMANCE_DATA,
    GET_POSITION_PERFORMANCE,
    GET_POSITION_PERFORMANCE_ERROR,
    GET_POSITION_PERFORMANCE_REQUEST,
    GET_TRADE_HISTORY,
    GET_UNSTICK_LOG,
    RESET_ALLOCATION_LOADING,
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
        console.log("getTradeHistory called - frontend");
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

// get allocation data
export const getAllocationData = () => async (dispatch) => {
    dispatch({ type: RESET_ALLOCATION_LOADING });

    try {
        const res = await axios.get(`/api/damwidi/allocationData`);
        dispatch({ type: GET_ALLOCATION_DATA, payload: res.data });
    } catch (err) {
        console.log(err);
        dispatch({ type: GET_ALLOCATION_ERROR });
    }
};

// get one open position's purchase performance
export const getPositionPerformance = (requestedSymbol) => async (dispatch, getState) => {
    const symbol = requestedSymbol.trim().toUpperCase();
    const { positionPerformance, positionPerformanceLoading } = getState().damwidi;

    if (positionPerformance[symbol] || positionPerformanceLoading[symbol]) return;

    dispatch({ type: GET_POSITION_PERFORMANCE_REQUEST, payload: symbol });

    try {
        const res = await axios.get(`/api/damwidi/positionPerformance/${symbol}`);
        dispatch({ type: GET_POSITION_PERFORMANCE, payload: { symbol, data: res.data } });
    } catch (err) {
        console.log(err);
        dispatch({ type: GET_POSITION_PERFORMANCE_ERROR, payload: symbol });
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

// get open positions
export const getOpenPositions = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/openPositions`);
        dispatch({ type: GET_OPEN_POSITIONS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

import axios from 'axios';

import { GET_SP500_COMPONENTS, GET_STOCK_COMPONENTS, GET_ETFS, REMOVE_ETF, SET_CURRENT_ETF, CLEAR_CURRENT_ETF } from './types';

// get S&P500 components
export const getSP500Components = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/marketData/sp500`);
        dispatch({ type: GET_SP500_COMPONENTS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get ETF components
export const getStockComponents = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/marketData/stockInfo`);
        dispatch({ type: GET_STOCK_COMPONENTS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// get ETF's
export const getETFs = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/etf`);
        dispatch({ type: GET_ETFS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// add or update etf
export const addOrUpdateETF = (formData, history) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        await axios.post('/api/etf', formData, config);

        // redirect
        history.push('./etfs');
    } catch (err) {
        console.log(err);
    }
};

// add/update etf components
export const addOrUpdateComponents = (etfID, etf, components, history) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    components = components.map((component) => ({ weight: component.weight, symbol: component.symbol.toUpperCase() }));
    const body = JSON.stringify({ etfID, etf, components });
    try {
        await axios.post('/api/etf/components', body, config);

        // redirect
        history.push('./etfs');
    } catch (err) {
        console.log(err);
    }
};

// delete sector with admin privileges
export const deleteETF = (etfID) => async (dispatch) => {
    try {
        await axios.delete(`/api/etf/${etfID}`);
        dispatch({ type: REMOVE_ETF, payload: etfID });
    } catch (err) {
        // const errMsg = err ? `status: ${err.response.status}: ${err.response.data}` : 'unknown error with delete sector';
        // dispatch({ type: LOG_ERROR, payload: errMsg });
        console.log(err);
    }
};

// set current etf
export const setCurrent = (etf) => (dispatch) => {
    dispatch({ type: SET_CURRENT_ETF, payload: etf });
};

// clear current stock
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT_ETF });
};

// validate symbol
export const validateSymbol = async ({ symbol }) => {
    try {
        const res = await axios.get(`/api/etf/validate/${symbol}`);
        return !res.data.etf;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

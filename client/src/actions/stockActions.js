import axios from 'axios';

// bring in types
import { GET_STOCKS, REMOVE_STOCK, SET_CURRENT_STOCK, CLEAR_CURRENT_STOCK, LOG_ERROR } from './types';

// bring in actions
import { setMessage } from './messageActions';

// get all stocks
export const getStocks = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/stocks');
        dispatch({ type: GET_STOCKS, payload: res.data });
    } catch (err) {
        console.log(err);
        // console.log(err.response.data.msg);
        // dispatch({ type: POST_ERROR, payload: { msg: err.response.data.msg, status: err.response.status } });
    }
};

// add or update stock
export const addOrUpdateStock = ({ id, sector, symbol, companyName }, history) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const body = JSON.stringify({ id, sector, symbol, companyName });

    try {
        await axios.post('/api/stocks', body, config);

        // redirect
        history.push('./stocks');
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach((error) => dispatch(setMessage(error.param, error.msg)));
        }
    }
};

// delete sector with admin privileges
export const deleteStock = (stockID) => async (dispatch) => {
    try {
        await axios.delete(`/api/stocks/${stockID}`);
        dispatch({ type: REMOVE_STOCK, payload: stockID });
    } catch (err) {
        const errMsg = err ? `status: ${err.response.status}: ${err.response.data}` : 'unknown error with delete sector';
        dispatch({ type: LOG_ERROR, payload: errMsg });
    }
};

// validate symbol - check if symbol is in use
export const validateSymbol = ({ symbol }) => async (dispatch) => {
    try {
        const res = await axios.get(`/api/stocks/validate/${symbol}`);
        return !res.data.stock;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

// set current stock
export const setCurrent = (stock) => (dispatch) => {
    dispatch({ type: SET_CURRENT_STOCK, payload: stock });
};

// clear current stock
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT_STOCK });
};

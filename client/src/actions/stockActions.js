import axios from 'axios';

// bring in types
import { GET_STOCKS, SET_CURRENT_STOCK, CLEAR_CURRENT_STOCK } from './types';

// bring in actions

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

// set current stock
export const setCurrent = (stock) => (dispatch) => {
    dispatch({ type: SET_CURRENT_STOCK, payload: stock });
};

// clear current stock
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT_STOCK });
};

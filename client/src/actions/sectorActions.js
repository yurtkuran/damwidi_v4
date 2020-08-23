import axios from 'axios';

// bring in types
import { GET_SECTORS, SET_CURRENT_SECTOR, CLEAR_CURRENT_SECTOR } from './types';

// bring in actions

// get all stocks
export const getSectors = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/sectors');
        dispatch({ type: GET_SECTORS, payload: res.data });
    } catch (err) {
        console.log(err);
        // console.log(err.response.data.msg);
        // dispatch({ type: POST_ERROR, payload: { msg: err.response.data.msg, status: err.response.status } });
    }
};

// set current stock
export const setCurrent = (stock) => (dispatch) => {
    dispatch({ type: SET_CURRENT_SECTOR, payload: stock });
};

// clear current stock
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT_SECTOR });
};

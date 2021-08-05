import axios from 'axios';

// bring in types
import { GET_DAILY, RESET_ALPHA_LOADING } from './types';

// get daily candles
export const getDaily = (symbol) => async (dispatch) => {
    try {
        dispatch({ type: RESET_ALPHA_LOADING });

        const res = await axios.get(`/api/alphaVantage/daily/${symbol}`);
        dispatch({ type: GET_DAILY, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

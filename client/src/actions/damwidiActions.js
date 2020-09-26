import axios from 'axios';

import { GET_UNSTICK_LOG } from './types';

// get unstick log
export const getUnstick = () => async (dispatch) => {
    try {
        const res = await axios.get(`/api/damwidi/unstick`);
        dispatch({ type: GET_UNSTICK_LOG, payload: Object.values(res.data) });
    } catch (err) {
        console.log(err);
    }
};

import { v4 as uuidv4 } from 'uuid';
import { SET_MESSAGE, CLEAR_MESSAGES } from './types';

export const setMessage = (msg, alertType = 'danger', timeout = 5000) => (dispatch) => {
    const id = uuidv4();
    console.log('test');

    dispatch({
        type: SET_MESSAGE,
        payload: { msg, alertType, id },
    });
};

// clear error messages
export const clearMessages = () => (dispatch) => {
    dispatch({ type: CLEAR_MESSAGES });
};

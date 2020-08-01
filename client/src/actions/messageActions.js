import { SET_MESSAGE, CLEAR_MESSAGE, CLEAR_MESSAGES } from './types';

export const setMessage = (field, msg) => (dispatch) => {
    dispatch({
        type: SET_MESSAGE,
        payload: { field, msg },
    });
};

// clear error messages
export const clearMessages = (field = 'all') => (dispatch) => {
    if (field === 'all') {
        dispatch({ type: CLEAR_MESSAGES });
    } else {
        dispatch({ type: CLEAR_MESSAGE, payload: field });
    }
};

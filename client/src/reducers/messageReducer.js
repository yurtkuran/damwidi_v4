import { SET_MESSAGE, CLEAR_MESSAGES } from '../actions/types';

// const initialState = [];

const initialState = {
    authMessages: [],
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case SET_MESSAGE:
            return {
                ...state,
                authMessages: payload,
            };

        case CLEAR_MESSAGES:
            return {
                ...state,
                authMessages: null,
            };

        default:
            return state;
    }
};

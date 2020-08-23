import { SET_MESSAGE, CLEAR_MESSAGE, CLEAR_MESSAGES } from '../actions/types';

const initialState = [];

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case SET_MESSAGE:
            return [...state, payload];

        case CLEAR_MESSAGE:
            return state.filter((message) => message.field !== payload);

        case CLEAR_MESSAGES:
            return [];

        default:
            return state;
    }
};

import { LOG_ERROR } from '../actions/types';

const initialState = [];

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case LOG_ERROR:
            return [payload, ...state];
        default:
            return state;
    }
};

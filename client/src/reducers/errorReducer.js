import { LOG_ERROR } from '../actions/types';

const initialState = [];

const errorReducer = (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case LOG_ERROR:
            return [payload, ...state];
        default:
            return state;
    }
};

export default errorReducer;

import { GET_STOCKS, SET_CURRENT_STOCK, CLEAR_CURRENT_STOCK } from '../actions/types';

const initialState = {
    stocks: [],
    current: null,
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_STOCKS:
            return {
                ...state,
                stocks: payload,
                loading: false,
            };

        case SET_CURRENT_STOCK:
            return {
                ...state,
                current: payload,
                loading: false,
            };

        case CLEAR_CURRENT_STOCK:
            return {
                ...state,
                current: null,
                loading: false,
            };

        default:
            return state;
    }
};

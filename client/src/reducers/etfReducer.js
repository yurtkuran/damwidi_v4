import { GET_SP500_COMPONENTS, GET_STOCK_COMPONENTS, GET_ETFS, REMOVE_ETF, SET_CURRENT_ETF, CLEAR_CURRENT_ETF } from '../actions/types';

const initialState = {
    etfs: [],
    sp500: [],
    stocks: [],
    current: null,
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_SP500_COMPONENTS:
            return {
                ...state,
                sp500: payload,
                loading: false,
            };

        case GET_STOCK_COMPONENTS:
            return {
                ...state,
                stocks: payload,
                loading: false,
            };

        case GET_ETFS:
            return {
                ...state,
                etfs: payload,
                loading: false,
            };

        case REMOVE_ETF:
            return {
                ...state,
                etfs: state.etfs.filter((etf) => etf._id !== payload),
                current: null,
                loading: false,
            };

        case SET_CURRENT_ETF:
            return {
                ...state,
                current: payload,
                loading: false,
            };

        case CLEAR_CURRENT_ETF:
            return {
                ...state,
                current: null,
                loading: false,
            };

        default:
            return state;
    }
};

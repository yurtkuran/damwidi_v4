import { GET_UNSTICK_LOG, GET_TRADE_HISTORY, GET_INTRADAY_DATA, GET_PERFORMANCE_DATA, GET_ABOVEBELOW_DATA, GET_HISTORY, RESET_DAMWIDI_LOADING } from '../actions/types';

const initialState = {
    unstick: [],
    history: [],
    intraDay: {},
    performance: {},
    abovebelow: {},
    historyData: {},
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_UNSTICK_LOG:
            return {
                ...state,
                unstick: payload,
                loading: false,
            };

        case GET_TRADE_HISTORY:
            return {
                ...state,
                history: payload,
                loading: false,
            };

        case GET_INTRADAY_DATA:
            return {
                ...state,
                intraDay: payload,
                loading: false,
            };

        case GET_PERFORMANCE_DATA:
            return {
                ...state,
                performance: payload,
                loading: false,
            };

        case GET_ABOVEBELOW_DATA:
            return {
                ...state,
                abovebelow: payload,
                loading: false,
            };

        case GET_HISTORY:
            return {
                ...state,
                historyData: payload,
                loading: false,
            };

        case RESET_DAMWIDI_LOADING:
            return {
                ...state,
                loading: true,
            };

        default:
            return state;
    }
};

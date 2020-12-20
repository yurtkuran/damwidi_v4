import { GET_UNSTICK_LOG, GET_TRADE_HISTORY, GET_INTRADAY_DATA } from '../actions/types';

const initialState = {
    unstick: [],
    history: [],
    intraDay: {},
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

        default:
            return state;
    }
};

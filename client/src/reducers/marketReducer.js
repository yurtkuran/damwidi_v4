import { GET_INTRADAY, GET_KEYSTATS } from '../actions/types';

const initialState = {
    realTimeIntraDay: [],
    keyStats: [],
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_INTRADAY:
            return {
                ...state,
                realTimeIntraDay: payload,
                loading: false,
            };

        case GET_KEYSTATS:
            return {
                ...state,
                keyStats: payload,
                loading: false,
            };

        default:
            return state;
    }
};

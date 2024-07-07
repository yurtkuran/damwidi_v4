import { GET_INTRADAY, GET_KEYSTATS, GET_PROFILE, GET_QUOTE, CLEAR_QUOTE } from '../actions/types';

const initialState = {
    realTimeIntraDay: [],
    keyStats: [],
    profile: [],
    quote: [],
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
           
        case GET_PROFILE:
            return {
                ...state,
                profile: payload,
                loading: false,
            };    

        case GET_QUOTE:
            return {
                ...state,
                quote: payload,
                loading: false,
            };

        case CLEAR_QUOTE:
            return {
                ...state,
                quote: [],
                loading: false,
            };

        default:
            return state;
    }
};

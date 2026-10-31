import { GET_PROFILE, GET_QUOTE, CLEAR_QUOTE } from '../actions/types';

const initialState = {
    profile: [],
    quote: [],
    loading: true,
};

const marketReducer = (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
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

export default marketReducer;

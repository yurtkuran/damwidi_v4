import { GET_DAILY, RESET_ALPHA_LOADING } from '../actions/types';

const initialState = {
    daily: {},
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_DAILY:
            return {
                ...state,
                daily: payload,
                loading: false,
            };

        case RESET_ALPHA_LOADING:
            return {
                ...state,
                loading: true,
            };

        default:
            return state;
    }
};

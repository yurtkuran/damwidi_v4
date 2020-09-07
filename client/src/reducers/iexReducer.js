import { GET_IEX_DETAILS, GET_IEX_USAGE } from '../actions/types';

const initialState = {
    details: {},
    loadingDetails: true,
    usage: {},
    loadingUsage: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_IEX_USAGE:
            return {
                ...state,
                usage: payload,
                loadingUsage: false,
            };

        case GET_IEX_DETAILS:
            return {
                ...state,
                details: payload,
                loadingDetails: false,
            };

        default:
            return state;
    }
};

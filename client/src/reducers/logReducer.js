import { GET_LOGS } from '../actions/types';

const initialState = {
    logs: [],
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_LOGS:
            return {
                ...state,
                logs: payload,
                loading: false,
            };

        default:
            return state;
    }
};

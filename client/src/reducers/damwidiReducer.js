import { GET_UNSTICK_LOG } from '../actions/types';

const initialState = {
    unstick: [],
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

        default:
            return state;
    }
};

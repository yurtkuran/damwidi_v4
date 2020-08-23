import { GET_SECTORS, SET_CURRENT_SECTOR, CLEAR_CURRENT_SECTOR } from '../actions/types';

const initialState = {
    sectors: [],
    current: null,
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_SECTORS:
            return {
                ...state,
                sectors: payload,
                loading: false,
            };

        case SET_CURRENT_SECTOR:
            return {
                ...state,
                current: payload,
                loading: false,
            };

        case CLEAR_CURRENT_SECTOR:
            return {
                ...state,
                current: null,
                loading: false,
            };

        default:
            return state;
    }
};

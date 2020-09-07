import { GET_SECTORS, UPDATE_SECTOR, REMOVE_SECTOR, SET_CURRENT_SECTOR, CLEAR_CURRENT_SECTOR } from '../actions/types';

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

        case UPDATE_SECTOR:
            return {
                ...state,
                sectors: state.sectors.map((sector) => (sector.id === payload.id ? payload : sector)),
                current: null,
                loading: false,
            };

        case REMOVE_SECTOR:
            return {
                ...state,
                sectors: state.sectors.filter((sector) => sector.id !== payload),
                current: null,
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

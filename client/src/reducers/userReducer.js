import { GET_USERS, REMOVE_USER, SET_CURRENT, CLEAR_CURRENT } from '../actions/types';

const initialState = {
    users: [],
    user: null,
    current: null,
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_USERS:
            return {
                ...state,
                users: payload,
                current: null,
                loading: false,
            };

        case REMOVE_USER:
            return {
                ...state,
                users: state.users.filter((user) => user._id !== payload),
                current: null,
                loading: false,
            };

        case SET_CURRENT:
            return {
                ...state,
                current: payload,
                loading: false,
            };

        case CLEAR_CURRENT:
            return {
                ...state,
                current: null,
                loading: false,
            };

        default:
            return state;
    }
};

import { REGISTER_SUCCESS, REGISTER_FAIL, USER_LOADED, AUTH_ERROR, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, EMAIL_VERIFIED } from '../actions/types';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case USER_LOADED:
            return {
                ...state,
                isAuthenticated: true,
                user: payload,
                errorMessages: null,
                loading: false,
            };

        case REGISTER_SUCCESS:
            return {
                ...state,
                ...payload,
                isAuthenticated: false,
                loading: false,
            };

        case LOGIN_SUCCESS:
            localStorage.setItem('token', payload.token);
            return {
                ...state,
                ...payload,
                isAuthenticated: true,
                loading: false,
            };

        case EMAIL_VERIFIED:
            return {
                ...state,
            };

        case REGISTER_FAIL:
        case LOGIN_FAIL:
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
            };

        case AUTH_ERROR:
        case LOGOUT:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                user: null,
                loading: false,
            };

        default:
            return state;
    }
};

import axios from 'axios';

// bring in types
import { REGISTER_SUCCESS, REGISTER_FAIL, USER_LOADED, AUTH_ERROR, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, EMAIL_VERIFIED } from './types';

// bring in actions
import { setAlert } from './alertActions';
import { setMessage } from './messageActions';

// bring in functions
import setAuthToken from '../utils/setAuthToken';

// load user
export const loadUser = () => async (dispatch) => {
    // if a token exists in local storage, add to global header
    if (localStorage.token) {
        await setAuthToken(localStorage.token);
    }

    try {
        const res = await axios.get('/api/auth');
        dispatch({ type: USER_LOADED, payload: res.data });
    } catch (err) {
        dispatch({ type: AUTH_ERROR });
    }
};

// register user
export const register =
    ({ firstName, lastName, email, password, history }) =>
    async (dispatch) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const body = JSON.stringify({ firstName, lastName, email, password });

        try {
            const res = await axios.post('/api/users', body, config);
            dispatch({
                type: REGISTER_SUCCESS,
                payload: res.data,
            });
            history.push('./login');
            // dispatch(loadUser());
        } catch (err) {
            // loop through errors
            const errors = err.response.data.errors;
            if (errors) {
                errors.forEach((error) => dispatch(setMessage(error.param, error.msg)));
            }

            dispatch({ type: REGISTER_FAIL, payload: errors });
        }
    };

// login user
export const login =
    ({ email, password }) =>
    async (dispatch) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const body = JSON.stringify({ email, password });

        try {
            const res = await axios.post('/api/auth', body, config);
            dispatch({
                type: LOGIN_SUCCESS,
                payload: res.data,
            });
            dispatch(loadUser());
        } catch (err) {
            // loop through errors
            const errors = err.response.data.errors;

            if (errors) {
                errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
            }

            dispatch({
                type: LOGIN_FAIL,
            });
        }
    };

// confirm JWT
export const confirmToken = (token) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const body = JSON.stringify({ token });

    try {
        const res = await axios.post('/api/confirm', body, config);
        console.log(res.data);
        dispatch({ type: EMAIL_VERIFIED });
    } catch (err) {
        console.log(err.response.data);
        dispatch({ type: AUTH_ERROR });
    }
};

// logout and clear profile
export const logout = () => (dispatch) => {
    dispatch({ type: LOGOUT });
};

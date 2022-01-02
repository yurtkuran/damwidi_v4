import axios from 'axios';

// bring in types
import { GET_USERS, REMOVE_USER, SET_CURRENT, CLEAR_CURRENT, LOG_ERROR, GET_LOGS } from './types';

// bring in actions
import { setMessage } from './messageActions';

// get all users
export const getUsers = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/users');
        dispatch({ type: GET_USERS, payload: res.data });
    } catch (err) {
        console.log(err);
        // console.log(err.response.data.msg);
        // dispatch({ type: POST_ERROR, payload: { msg: err.response.data.msg, status: err.response.status } });
    }
};

// update user with admin privileges
export const updateUser = ({ _id, firstName, lastName, email, isAdmin, isMember, isVerified }, history) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const body = JSON.stringify({ _id, firstName, lastName, email, isAdmin, isMember, isVerified });

    try {
        await axios.post('/api/users/update', body, config);
        history.push('./users');
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach((error) => dispatch(setMessage(error.param, error.msg)));
        }
    }
};

// delete user with admin privileges
export const deleteUser = (userID) => async (dispatch) => {
    // const test = '5edb7a773329b379e06d752';
    try {
        await axios.delete(`/api/users/${userID}`);
        dispatch({ type: REMOVE_USER, payload: userID });
    } catch (err) {
        const errMsg = err ? `status: ${err.response.status}: ${err.response.data}` : 'unknown error with delete user';
        dispatch({ type: LOG_ERROR, payload: errMsg });
    }
};

// validate user
// used to validate email address prior to submitting form
export const validate = ({ email }) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const body = JSON.stringify({ email });

    try {
        const res = await axios.post('/api/users/validate', body, config);
        return !res.data.user;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

// set current user
export const setCurrent = (user) => (dispatch) => {
    dispatch({ type: SET_CURRENT, payload: user });
};

// clear current user
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT });
};

// get user logs
export const getLogs = () => async (dispatch) => {
    try {
        const res = await axios.get('/api/users/log');
        dispatch({ type: GET_LOGS, payload: res.data });
        return res;
    } catch (err) {
        console.log(err);
    }
};

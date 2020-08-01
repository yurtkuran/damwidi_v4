import axios from 'axios';

// bring in types
import { GET_USERS, REMOVE_USER, SET_CURRENT, CLEAR_CURRENT } from './types';

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
        const res = await axios.post('/api/users/update', body, config);
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
    try {
        await axios.delete(`/api/users/${userID}`);
        dispatch({ type: REMOVE_USER, payload: userID });
    } catch (err) {}
};

// validate user
// used to validate email address prior to submitting form
export const validate = async ({ email }) => {
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
        return false;
    }
};

// set current user
export const setCurrent = (userID) => (dispatch) => {
    dispatch({ type: SET_CURRENT, payload: userID });
};

export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT });
};

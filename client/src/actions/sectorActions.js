import axios from 'axios';

// bring in types
import { GET_SECTORS, UPDATE_SECTOR, REMOVE_SECTOR, SET_CURRENT_SECTOR, CLEAR_CURRENT_SECTOR, LOG_ERROR } from './types';

// bring in actions
import { setMessage } from './messageActions';

// get all sectors
export const getSectors = (sort = 'weight') => async (dispatch) => {
    try {
        const res = await axios.get(`/api/sectors/${sort}`);
        dispatch({ type: GET_SECTORS, payload: res.data });
    } catch (err) {
        console.log(err);
    }
};

// update sector weighting
export const updateSectorWeight = (id, symbol, weight) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const body = JSON.stringify({ id, weight });

    try {
        const res = await axios.post('/api/sectors/updateSectorWeight', body, config);
        dispatch({ type: UPDATE_SECTOR, payload: res.data });
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach((error) => dispatch(setMessage(error.param, error.msg)));
        }
    }
};

// add or update sector
export const addOrUpdateSector = ({ id, symbol, name, description }, history) => async (dispatch) => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const body = JSON.stringify({ id, symbol, name, description });

    try {
        await axios.post('/api/sectors', body, config);

        // redirect
        history.push('./sectors');
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach((error) => dispatch(setMessage(error.param, error.msg)));
        }
    }
};

// delete sector with admin privileges
export const deleteSector = (sectorID) => async (dispatch) => {
    console.log(sectorID);
    try {
        await axios.delete(`/api/sectors/${sectorID}`);
        dispatch({ type: REMOVE_SECTOR, payload: sectorID });
    } catch (err) {
        const errMsg = err ? `status: ${err.response.status}: ${err.response.data}` : 'unknown error with delete sector';
        dispatch({ type: LOG_ERROR, payload: errMsg });
    }
};

// validate symbol - check if symbol is in use
export const validateSymbol = ({ symbol }) => async (dispatch) => {
    try {
        const res = await axios.get(`/api/sectors/validate/${symbol}`);
        return !res.data.sector;
    } catch (err) {
        console.log(err.response);
        return false;
    }
};

// set current sector
export const setCurrent = (stock) => (dispatch) => {
    dispatch({ type: SET_CURRENT_SECTOR, payload: stock });
};

// clear current sector
export const clearCurrent = () => (dispatch) => {
    dispatch({ type: CLEAR_CURRENT_SECTOR });
};

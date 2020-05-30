// root reducer
import { combineReducers } from 'redux';

// bring in reducers
import alertReducer from './alertReducer';
import authReducer from './authReducer';

export default combineReducers({
    alert: alertReducer,
    auth: authReducer,
});

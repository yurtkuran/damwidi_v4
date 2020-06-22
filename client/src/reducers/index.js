// root reducer
import { combineReducers } from 'redux';

// bring in reducers
import alertReducer from './alertReducer';
import authReducer from './authReducer';
import messageReducer from './messageReducer';

export default combineReducers({
    alert: alertReducer,
    auth: authReducer,
    message: messageReducer,
});

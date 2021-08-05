// root reducer
import { combineReducers } from 'redux';

// bring in reducers
import alertReducer from './alertReducer';
import alphaVantageReducer from './alphaVantageReducer';
import authReducer from './authReducer';
import damwidiReducer from './damwidiReducer';
import errorReducer from './errorReducer';
import etfReducer from './etfReducer';
import iexReducer from './iexReducer';
import logReducer from './logReducer';
import marketReducer from './marketReducer';
import messageReducer from './messageReducer';
import sectorReducer from './sectorReducer';
import stockReducer from './stockReducer';
import userReducer from './userReducer';

export default combineReducers({
    alert: alertReducer,
    alphaVantage: alphaVantageReducer,
    auth: authReducer,
    damwidi: damwidiReducer,
    error: errorReducer,
    etf: etfReducer,
    iex: iexReducer,
    log: logReducer,
    market: marketReducer,
    message: messageReducer,
    sector: sectorReducer,
    stock: stockReducer,
    user: userReducer,
});

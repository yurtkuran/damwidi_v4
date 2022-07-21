import {
    GET_UNSTICK_LOG,
    GET_TRADE_HISTORY,
    GET_PERFORMANCE,
    GET_PERFORMANCE_DATA, // todo
    GET_ABOVEBELOW_DATA,
    GET_HISTORY,
    GET_OPEN_POSITIONS,
    GET_OPEN_POSDETAIL,
    GET_ALLOCATION,
    SET_REALTIME_DATA,
    RESET_DAMWIDI_LOADING,
} from '../actions/types';

const initialState = {
    unstick: [],
    history: [],
    performance: {},
    prices: {},
    abovebelow: {},
    historyData: {},
    allocation: {},
    openPositionsDetail: {},
    openPositionsDetailLoading: true,
    openPositions: {},
    openPositionsLoading: true,
    loading: true,
};

export default (state = initialState, action) => {
    const { type, payload } = action;

    switch (type) {
        case GET_UNSTICK_LOG:
            return {
                ...state,
                unstick: payload,
                loading: false,
            };

        case GET_TRADE_HISTORY:
            return {
                ...state,
                history: payload,
                loading: false,
            };

        case GET_PERFORMANCE:
            return {
                ...state,
                performance: payload.sectors,
                prices: payload.prices,
                loading: false,
            };

        case GET_PERFORMANCE_DATA:
            return {
                ...state,
                performance: payload,
                loading: false,
            };

        case GET_ABOVEBELOW_DATA:
            return {
                ...state,
                abovebelow: payload,
                loading: false,
            };

        case GET_HISTORY:
            return {
                ...state,
                historyData: payload,
                loading: false,
            };

        case GET_OPEN_POSITIONS:
            return {
                ...state,
                openPositions: payload,
                openPositionsLoading: false,
            };

        case GET_OPEN_POSDETAIL:
            return {
                ...state,
                openPositionsDetail: payload,
                openPositionsDetailLoading: false,
            };
        case GET_ALLOCATION:
            return {
                ...state,
                allocation: payload,
                loading: false,
            };

        case SET_REALTIME_DATA:
            return {
                ...state,
                prices: payload,
            };

        case RESET_DAMWIDI_LOADING:
            return {
                ...state,
                loading: true,
            };

        default:
            return state;
    }
};

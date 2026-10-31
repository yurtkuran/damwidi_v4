import {
    GET_ABOVEBELOW_DATA,
    GET_ALLOCATION_DATA,
    GET_ALLOCATION_ERROR,
    GET_DASHBOARD_DATA,
    GET_DASHBOARD_ERROR,
    GET_HISTORY,
    GET_OPEN_POSITIONS,
    GET_PERFORMANCE_DATA,
    GET_POSITION_PERFORMANCE,
    GET_POSITION_PERFORMANCE_ERROR,
    GET_POSITION_PERFORMANCE_REQUEST,
    GET_TRADE_HISTORY,
    GET_UNSTICK_LOG,
    RESET_ALLOCATION_LOADING,
    RESET_DASHBOARD_LOADING,
    RESET_DAMWIDI_LOADING,
} from '../actions/types';

const initialState = {
    unstick: [],
    history: [],
    dashboardData: null,
    dashboardLoading: true,
    dashboardError: false,
    performance: {},
    abovebelow: {},
    historyData: {},
    openPositions: {},
    openPositionsLoading: true,
    allocationData: null,
    allocationLoading: true,
    allocationError: false,
    positionPerformance: {},
    positionPerformanceLoading: {},
    positionPerformanceErrors: {},
    loading: true,
};

const damwidiReducer = (state = initialState, action) => {
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

        case GET_DASHBOARD_DATA:
            return {
                ...state,
                dashboardData: payload,
                dashboardLoading: false,
                dashboardError: false,
            };

        case GET_DASHBOARD_ERROR:
            return {
                ...state,
                dashboardLoading: false,
                dashboardError: true,
            };

        case GET_ALLOCATION_DATA:
            return {
                ...state,
                allocationData: payload,
                allocationLoading: false,
                allocationError: false,
            };

        case GET_ALLOCATION_ERROR:
            return {
                ...state,
                allocationLoading: false,
                allocationError: true,
            };

        case GET_POSITION_PERFORMANCE_REQUEST:
            return {
                ...state,
                positionPerformanceLoading: { ...state.positionPerformanceLoading, [payload]: true },
                positionPerformanceErrors: { ...state.positionPerformanceErrors, [payload]: false },
            };

        case GET_POSITION_PERFORMANCE:
            return {
                ...state,
                positionPerformance: { ...state.positionPerformance, [payload.symbol]: payload.data },
                positionPerformanceLoading: { ...state.positionPerformanceLoading, [payload.symbol]: false },
                positionPerformanceErrors: { ...state.positionPerformanceErrors, [payload.symbol]: false },
            };

        case GET_POSITION_PERFORMANCE_ERROR:
            return {
                ...state,
                positionPerformanceLoading: { ...state.positionPerformanceLoading, [payload]: false },
                positionPerformanceErrors: { ...state.positionPerformanceErrors, [payload]: true },
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

        case RESET_DAMWIDI_LOADING:
            return {
                ...state,
                loading: true,
            };

        case RESET_ALLOCATION_LOADING:
            return {
                ...state,
                allocationLoading: true,
                allocationError: false,
            };

        case RESET_DASHBOARD_LOADING:
            return {
                ...state,
                dashboardLoading: true,
                dashboardError: false,
            };

        default:
            return state;
    }
};

export default damwidiReducer;

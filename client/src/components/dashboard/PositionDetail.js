import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Performance from './Performance';
import Candlestick from '../charts/Candlestick';
import Spinner from '../layout/Spinner';

// bring in actions
import { getPositionPerformance } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const PositionDetail = ({ error, getPositionPerformance, loading, performanceData, symbol }) => {
    useEffect(() => {
        getPositionPerformance(symbol);
    }, [getPositionPerformance, symbol]);

    const categories = useMemo(() => (performanceData ? performanceData.purchases.map((purchase) => purchase.dateBasis) : []), [performanceData]);
    const seriesPrice = useMemo(() => (performanceData ? performanceData.purchases.map((purchase) => purchase.priceGain) : []), [performanceData]);
    const seriesSPY = useMemo(() => (performanceData ? performanceData.purchases.map((purchase) => purchase.spyGain) : []), [performanceData]);

    if (loading || !performanceData) {
        return error ? <p>unable to load position performance</p> : <Spinner />;
    }

    return (
        <div className='charts charts-secondary'>
            <Candlestick symbol={symbol} type={'intraday'} simple={true} />
            <Performance categories={categories} seriesSPY={seriesSPY} seriesPrice={seriesPrice} />
        </div>
    );
};

PositionDetail.propTypes = {
    error: PropTypes.bool,
    getPositionPerformance: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    performanceData: PropTypes.object,
    symbol: PropTypes.string.isRequired,
};

const mapStatetoProps = (state, { symbol }) => ({
    error: Boolean(state.damwidi.positionPerformanceErrors[symbol]),
    loading: Boolean(state.damwidi.positionPerformanceLoading[symbol]),
    performanceData: state.damwidi.positionPerformance[symbol],
});

export default connect(mapStatetoProps, { getPositionPerformance })(PositionDetail);

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Performance from './Performance';
import Candlestick from '../charts/Candlestick';

// bring in actions
import { getIntraDayData } from '../../actions/marketActions';

// bring in functions and hooks

// set initial state

const PositionDetail = ({ symbol, performanceData }) => {
    // state for performance chart
    const [categories, setCategories] = useState([]);
    const [seriesPrice, setSeriesPrice] = useState([]);
    const [seriesSPY, setSeriesSPY] = useState([]);
    const [loading, setLoading] = useState(true);

    // format data when component loads
    useMemo(() => {
        performanceData[symbol].purchases.forEach((purchase) => {
            categories.push(purchase.dateBasis);
            seriesPrice.push(purchase.priceGain);
            seriesSPY.push(purchase.spyGain);
        });

        setCategories(categories);
        setSeriesPrice(seriesPrice);
        setSeriesSPY(seriesSPY);
        setLoading(false);
    }, [symbol, performanceData, categories, seriesPrice, seriesSPY]);

    return (
        !loading && (
            <div className='charts'>
                <Candlestick symbol={symbol} type={'intraday'} simple={true} />
                <Performance categories={categories} seriesSPY={seriesSPY} seriesPrice={seriesPrice} />
            </div>
        )
    );
};

PositionDetail.propTypes = {
    performanceData: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    performanceData: state.damwidi.intraDay.performanceData.data,
});

export default connect(mapStatetoProps, { getIntraDayData })(PositionDetail);

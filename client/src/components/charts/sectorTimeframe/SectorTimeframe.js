import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import './sectorTimeframe.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import SectorTimeframeChart from './SectorTimeframeChart';

// bring in actions
import { getPerformanceData } from '../../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const timeframes = ['1wk', '2wk', '4wk', 'ytd', '1yr'];

const SectorTimeframe = ({ damwidi: { performance, loading }, getPerformanceData }) => {
    // load performance data when component loads
    useEffect(() => {
        getPerformanceData();
    }, [getPerformanceData]);

    return (
        <>
            <h6>sector by timeframe</h6>
            <div className='timeframe_charts_container'>
                {!loading && timeframes.map((timeframe) => <SectorTimeframeChart key={timeframe} timeframe={timeframe} data={performance} />)}
            </div>
        </>
    );
};

SectorTimeframe.propTypes = {
    getPerformanceData: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getPerformanceData })(SectorTimeframe);

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import './AboveBelow.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../../layout/Spinner';

// bring in actions
import { getAboveBelowData } from '../../../actions/damwidiActions';
import AboveBelowChart from './AboveBelowChart';

// bring in functions and hooks

// set initial state
const timeFrames = ['1wk', '2wk', '4wk', '8wk', '1qtr', '1yr', 'ytd'];

const TimeFrameButton = ({ timeFrame, current, handleButtonClick }) => {
    console.log(current);
    return (
        <button className={`timeframe btn ${timeFrame === current ? 'selected' : ''}`} value={timeFrame} onClick={(e) => handleButtonClick(e.target.value)}>
            {timeFrame}
        </button>
    );
};

const AboveBelow = ({
    damwidi: {
        abovebelow: { labels, above, below, rs, chartConfig },
        loading,
    },
    getAboveBelowData,
}) => {
    // state handler for timeframe
    const [timeframe, setTimeframe] = useState('4wk');

    // load performance data when component loads
    useEffect(() => {
        getAboveBelowData(timeframe);
    }, [timeframe]);

    // timeframe button click handler
    const handleButtonClick = (timeframe) => {
        setTimeframe(timeframe);
    };

    return (
        <div>
            <h4>above - below</h4>

            <div className='timeframe-button-container'>
                {timeFrames.map((timeFrame, idx) => (
                    <TimeFrameButton key={idx} timeFrame={timeFrame} current={timeframe} handleButtonClick={handleButtonClick} />
                ))}
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <>
                    <AboveBelowChart title={'above'} labels={labels} data={above} chartConfig={chartConfig['above']} />
                    <AboveBelowChart title={'below'} labels={labels} data={below} chartConfig={chartConfig['below']} />
                    <AboveBelowChart title={'relative strength'} labels={labels} data={rs} chartConfig={chartConfig['rs']} />
                </>
            )}
        </div>
    );
};

AboveBelow.propTypes = {
    getAboveBelowData: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getAboveBelowData })(AboveBelow);

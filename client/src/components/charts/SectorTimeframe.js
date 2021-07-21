import React from 'react';

// bring in dependencies
import './SectorTimeframe.css';

// bring in redux

// bring in components
import SectorTimeframeChart from './SectorTimeframeChart';

// bring in actions

// bring in functions and hooks

// set initial state

// const timeframes = ['1wk', '2wk', '4wk', '1qtr', 'ytd', '1yr'];
const timeframes = ['1wk', '2wk', '4wk', 'ytd', '1yr'];

const SectorTimeframe = () => {
    return (
        <>
            <h4>sector by timeframe</h4>
            <div className='timeframe_charts_container'>
                {timeframes.map((timeframe) => (
                    <SectorTimeframeChart key={timeframe} timeframe={timeframe} />
                ))}
            </div>
        </>
    );
};

export default SectorTimeframe;

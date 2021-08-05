import React, { useEffect, useState } from 'react';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions

// bring in functions and hooks

// set initial state

const IndexGauge = ({ indexReturn: { DAM, SPY } }) => {
    // state handler for damwidi-to-spy performance
    const [performance, setPerformnace] = useState(0);

    // load performance when data is available
    useEffect(() => {
        const perf = Math.round((DAM - SPY) * 10000) / 10000;
        setPerformnace(perf);
    }, [DAM, SPY]);

    const Performance = () => {
        return <h5 className={performance < 0 ? 'index-down' : 'index-up'}>{numeral(performance).format('0.00%')}</h5>;
    };

    const PerformanceArrow = () => {
        return (
            <div className='gauge-arrow-wrapper'>
                <i className={performance < 0 ? downArrowClass : upArrowClass}></i>
            </div>
        );
    };

    return typeof DAM === 'undefined' || SPY === 'undefined' ? (
        <Spinner />
    ) : (
        <div className='index-gauge'>
            {performance >= 0 ? (
                <>
                    <PerformanceArrow />
                    <Performance />
                </>
            ) : (
                <>
                    <Performance />
                    <PerformanceArrow />
                </>
            )}
        </div>
    );
};

export default IndexGauge;

const upArrowClass = `fas fa-caret-up index-up gauge-arrow`;
const downArrowClass = `fas fa-caret-down index-down gauge-arrow`;

import React, { useEffect, useState } from 'react';

// bring in dependencies
import numeral from 'numeral';
import { round } from '../../utils/round';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const changePercent = (price, previous) => {
    return (price - previous) / previous;
};

const IndexGauge = ({ damData, spyData }) => {
    // default border style
    const defaultBorderStyle = '1px solid rgba(0, 0, 0, 0.2)';

    // state handler for damwidi-to-spy performance
    const [performance, setPerformnace] = useState(0);
    const [style, setStyle] = useState({ border: defaultBorderStyle });

    // load performance when data is available
    useEffect(() => {
        const damChangePercent = changePercent(damData.price, damData.previousClose);
        const spyChangePercent = changePercent(spyData.price, spyData.previousClose);
        const value = round(damChangePercent - spyChangePercent, 5);
        setPerformnace(value);
    }, [damData, spyData]);

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

    return (
        <div className='index-gauge' style={style}>
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

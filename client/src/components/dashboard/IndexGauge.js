import React, { useEffect, useState } from 'react';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions

// bring in functions and hooks

// set initial state

const IndexGauge = ({ indexReturn: { DAM, SPY }, trades: { DAM: tradeDAM, SPY: tradeSPY } }) => {
    // default border style
    const defaultBorderStyle = '1px solid rgba(0, 0, 0, 0.2)';

    // state handler for damwidi-to-spy performance
    const [performance, setPerformnace] = useState(0);
    const [style, setStyle] = useState({ border: defaultBorderStyle });

    // load performance when data is available
    useEffect(() => {
        if (DAM?.changePercent !== undefined && SPY?.changePercent !== undefined) {
            const value = Math.round((DAM?.changePercent - SPY?.changePercent) * 10000) / 10000;
            setPerformnace(value);
        }
    }, [DAM, SPY]);

    // update performacne with realtime trades
    useEffect(() => {
        if (tradeDAM?.price !== undefined && tradeSPY?.price !== undefined) {
            // calculate realtime DAM change percent
            const changePercentDAM = (tradeDAM.price - DAM.previousClose) / DAM.previousClose;

            // calculate realtime SPY change percent
            const changePercentSPY = (tradeSPY.price - SPY.previousClose) / SPY.previousClose;

            const value = Math.round((changePercentDAM - changePercentSPY) * 10000) / 10000;

            // update border
            if (value !== performance) {
                let border = '';
                if (value > performance) {
                    border = '4px solid var(--up)';
                } else if (value < performance) {
                    border = '4px solid var(--down)';
                }
                setStyle({ border });

                setTimeout(() => {
                    setStyle({ border: defaultBorderStyle });
                }, 200);
            }

            // update value
            setPerformnace(value);
        }
    }, [tradeDAM, tradeSPY, DAM, SPY]);

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

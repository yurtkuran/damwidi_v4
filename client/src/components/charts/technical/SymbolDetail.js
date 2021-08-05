import React from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const SymbolDetail = ({ data: { symbol, companyName, latestPrice, change, changePercent, week52High, week52Low } }) => {
    let tickClass = '';
    if (change > 0) {
        tickClass = 'up';
    } else if (change < 0) {
        tickClass = 'down';
    }

    return (
        <table className='symbolDetailTable'>
            <thead>
                <tr>
                    <th>Name</th>
                    <th className='text-right'>Last</th>
                    <th className='text-right'>Change</th>
                    <th className='text-right'>Change %</th>
                    <th className='text-right'>52Wk High</th>
                    <th className='text-right'>52Wk Low</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{companyName}</td>
                    <td className='text-right'>{numeral(latestPrice).format('$0,0.00')}</td>
                    <td className={`text-right ${tickClass}`}>{numeral(change).format('$0.00')}</td>
                    <td className={`text-right ${tickClass}`}>{numeral(changePercent).format('0.00%')}</td>
                    <td className='text-right'>{numeral(week52High).format('$0,0.00')}</td>
                    <td className='text-right'>{numeral(week52Low).format('$0,0.00')}</td>
                </tr>
            </tbody>
        </table>
    );
};

SymbolDetail.propTypes = {
    data: PropTypes.object.isRequired,
};

export default SymbolDetail;

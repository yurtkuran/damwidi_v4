import React from 'react';

// bring in dependencies
import PropTypes from 'prop-types';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const RecentSymbols = ({ symbols, handleRecenSymbol }) => {
    return (
        <div className='recent-symbl-list'>
            {symbols.map((symbol, idx) => (
                <button key={idx} className='btn recent-symbol' onClick={() => handleRecenSymbol(symbol)}>
                    {symbol}
                </button>
            ))}
        </div>
    );
};

RecentSymbols.propTypes = {
    symbols: PropTypes.array.isRequired,
};

export default RecentSymbols;

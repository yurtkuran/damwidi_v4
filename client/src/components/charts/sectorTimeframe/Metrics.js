import React from 'react';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const Metrics = ({ label, value }) => {
    return (
        <div>
            {label}: <span className={value < 0 ? 'down' : 'up'}>{numeral(value).format('0.0')}% </span>
        </div>
    );
};

export default Metrics;

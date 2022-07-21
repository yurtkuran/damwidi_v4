import React from 'react';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

const IndexCard = ({ index, label, data: { price, previousClose } }) => {
    const change = price - previousClose;
    const changePercent = change / previousClose;

    return (
        <div className={'index-card ' + (change < 0 ? 'index-card-down' : 'index-card-up')}>
            <div className='info'>
                <h3 className={change < 0 ? 'index-down' : 'index-up'}>{index}</h3> <span>{label}</span>
                <p>
                    <span className='price'>{numeral(price).format('$0,0.00')}</span>
                    <i className={change < 0 ? downArrowClass : upArrowClass}></i>
                    <span className={'change ' + (change < 0 ? 'index-down' : 'index-up')}>
                        {numeral(change).format('$0,0.00')} ({numeral(changePercent).format('0.00%')})
                    </span>
                </p>
            </div>
        </div>
    );
};

const upArrowClass = `fas fa-caret-up fa-lg px-2 index-up`;
const downArrowClass = `fas fa-caret-down fa-lg px-2 index-down`;

export default IndexCard;

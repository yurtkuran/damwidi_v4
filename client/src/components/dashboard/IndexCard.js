import React, { useEffect, useState } from 'react';

// bring in dependencies
import axios from 'axios';
import numeral from 'numeral';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions

// bring in functions and hooks

// set initial state

const IndexCard = ({ index, label, handleSetIndex }) => {
    const [loading, setLoading] = useState(true);
    const [indexData, setIndexData] = useState({});

    // destructure
    const { change, changePercent, latestPrice } = { ...indexData };

    // load index data
    useEffect(() => {
        const loadStockData = async () => {
            try {
                const iex = await axios.get(`api/marketData/quote/${index}`);
                setIndexData(iex.data);
                setLoading(false);
                handleSetIndex(index, iex.data.changePercent);
            } catch (err) {
                console.error(err);
            }
        };
        loadStockData();
    }, [handleSetIndex, index]);

    return loading ? (
        <Spinner />
    ) : (
        <div className={'index-card ' + (change < 0 ? 'index-card-down' : 'index-card-up')}>
            <div className='info'>
                <h3 className={change < 0 ? 'index-down' : 'index-up'}>{index}</h3> <span>{label}</span>
                <p>
                    <span className='price'>{numeral(latestPrice).format('$0,0.00')}</span>
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

export default connect(null, null)(IndexCard);

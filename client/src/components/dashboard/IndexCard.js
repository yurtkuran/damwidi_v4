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

const IndexCard = ({ index, label, handleSetIndex, trade }) => {
    const [loading, setLoading] = useState(true);
    const [indexData, setIndexData] = useState({});

    // destructure
    const { change, changePercent, latestPrice } = { ...indexData };

    // load index data
    useEffect(() => {
        const loadStockData = async () => {
            try {
                const quote = await axios.get(`api/marketData/quote/${index}`);
                setIndexData(quote.data);
                setLoading(false);

                // destructure index data
                const { latestPrice, change, changePercent, previousClose } = quote.data;
                handleSetIndex(index, { latestPrice, change, changePercent, previousClose });
            } catch (err) {
                console.error(err);
            }
        };
        loadStockData();
    }, [handleSetIndex, index]);

    // update latest price state
    useEffect(() => {
        if (trade != null) {
            const { price } = trade;
            setIndexData((prevData) => {
                return {
                    ...prevData,
                    latestPrice: price,
                    change: [price - prevData.previousClose],
                    changePercent: [(price - prevData.previousClose) / prevData.previousClose],
                };
            });
        }
    }, [trade]);

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

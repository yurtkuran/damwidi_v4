import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import './technical.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../../layout/Spinner';
import CandleChart from './CandleChart';
import ComparisonChart from './ComparisonChart';

// bring in actions
import { getDaily } from '../../../actions/alphaVantageActions';
import { getHistoryData } from '../../../actions/damwidiActions';
import { getQuote } from '../../../actions/marketActions';
import SymbolDetail from './SymbolDetail';

// bring in functions and hooks

// set initial state

const Technical = ({
    alphaVantage: { daily, loading },
    damwidi: { historyData, loading: historyLoading },
    market: { quote, loading: marketLoading },
    getDaily,
    getHistoryData,
    getQuote,
}) => {
    // symbol state
    const [symbol, setSymbol] = useState('');

    //error message state
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!loading && daily.hasOwnProperty('error')) {
            setErrorMessage(daily.error);
        }
    }, [daily]);

    // on change handler
    const onChange = (e) => setSymbol(e.target.value.toUpperCase());

    // symbol imput handler
    const onSubmit = async (e) => {
        e.preventDefault();

        //validate before submitting
        if (symbol.trim() === '') {
            setSymbol('');
            setErrorMessage('Symbol cannot be blank');
        } else {
            setErrorMessage('');
            getDaily(symbol);
            getHistoryData();
            getQuote(symbol);
        }
    };

    return (
        <div className='technical-container'>
            <div className='symbol-input-containter'>
                <form onSubmit={onSubmit}>
                    <div className='form-group form-row'>
                        <input
                            type='text'
                            id='inputStockSymbol'
                            name='symbol'
                            className='form-control form-control-sm symbol-input input'
                            placeholder='Enter Symbol...'
                            value={symbol}
                            onChange={onChange}
                        />
                        <button type='submit' name='submit' class='btn btn-sm btn-success'>
                            <i className='fa fa-play'></i>
                        </button>
                    </div>
                    <h6 className='small text-danger'>{errorMessage !== '' && errorMessage}</h6>
                </form>
                {!marketLoading && <SymbolDetail data={quote} />}
            </div>
            {!loading && daily.hasOwnProperty('Time Series (Daily)') && (
                <>
                    <CandleChart symbol={symbol} data={daily['Time Series (Daily)']} />
                    {!historyLoading && <ComparisonChart symbol={symbol} history={historyData} data={daily['Time Series (Daily)']} />}
                </>
            )}
        </div>
    );
};

Technical.propTypes = {
    getDaily: PropTypes.func.isRequired,
    getHistoryData: PropTypes.func.isRequired,
    getQuote: PropTypes.func.isRequired,
    alphaVantage: PropTypes.object.isRequired,
    damwidi: PropTypes.object.isRequired,
    market: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    alphaVantage: state.alphaVantage,
    damwidi: state.damwidi,
    market: state.market,
});

export default connect(mapStatetoProps, { getDaily, getHistoryData, getQuote })(Technical);

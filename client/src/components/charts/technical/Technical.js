import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import './technical.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import CandleChart from './CandleChart';
import ComparisonChart from './ComparisonChart';
import RecentSymbols from './RecentSymbols';

// bring in actions
import { getDaily } from '../../../actions/alphaVantageActions';
import { getHistoryData, getOpenPositions } from '../../../actions/damwidiActions';
import { getQuote } from '../../../actions/marketActions';
import SymbolDetail from './SymbolDetail';

// bring in functions and hooks
import { useLocalStorage } from '../../../customHooks/useStorage';

// set initial state
const sectors = ['XLK', 'XLV', 'XLY', 'XLC', 'XLF', 'XLI', 'XLP', 'XLRE', 'XLB', 'XLU', 'XLE'];

const Technical = ({
    alphaVantage: { daily, loading },
    damwidi: { historyData, loading: historyLoading, openPositions: allOpenPositions, openPositionsLoading },
    market: { quote, loading: marketLoading },
    getDaily,
    getHistoryData,
    getQuote,
    getOpenPositions,
}) => {
    // symbol state
    const [symbol, setSymbol] = useState('');
    const [symbolInput, setSymbolInput] = useState('');
    const [openPositions, setOpenPositions] = useState([]);

    // store recent symbols to local storage
    const [recentSymbols, setRecentSymbols] = useLocalStorage('symbols', []);

    // ref for input
    const inputRef = useRef();

    //error message state
    const [errorMessage, setErrorMessage] = useState('');

    const processSymbol = useCallback(
        (ticker) => {
            setSymbol(ticker);
            getDaily(ticker);
            getQuote(ticker);
            getHistoryData();
            setErrorMessage('');
        },
        [getDaily, getQuote, getHistoryData]
    );

    // load SPY when page loads
    // load open positions when page loads
    useEffect(() => {
        processSymbol('SPY');
        getOpenPositions();
    }, [processSymbol, getOpenPositions]);

    // store open positions to local stat4
    useEffect(() => {
        if (!openPositionsLoading) {
            setOpenPositions(() => allOpenPositions.filter((position) => position.type === 'K').map((position) => position.symbol));
        }
    }, [openPositionsLoading, allOpenPositions]);

    // remove any open positions from recent symbols array
    useEffect(() => {
        if (recentSymbols.length > 0 && openPositions.length > 0) {
            setRecentSymbols(recentSymbols.filter((symbol) => !openPositions.includes(symbol)));
        }
        // disabled dependency rule since adding recentSymbols to dependency array will cause infinate loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openPositions]);

    // display error if invalid symbol, else store symbol to local storage
    useEffect(() => {
        if (!loading) {
            if (daily.hasOwnProperty('error')) {
                setErrorMessage(daily.error);
            } else if (symbol !== 'SPY' && symbol.trim !== '' && !sectors.includes(symbol) && !openPositions.includes(symbol)) {
                // do not store SPY to recents
                let prevSymbols = recentSymbols.filter((ticker) => ticker !== symbol);
                if (recentSymbols.includes(symbol)) {
                    // put existing symboly at the end of the array
                    setRecentSymbols([...prevSymbols, symbol]);
                } else {
                    // when more than 10 recent symbols, remove the oldest from the list (ie, the first in the array)
                    prevSymbols = prevSymbols.slice(prevSymbols.length <= 10 ? 0 : 1);
                    setRecentSymbols([...prevSymbols, symbol]);
                }
            }
        }
        // eslint-disable-next-line
    }, [daily, loading, symbol]);

    // recent symbol button handler
    const handleRecenSymbol = (ticker) => {
        processSymbol(ticker);

        // clear symbol input
        setSymbolInput('');
    };

    // on change handler
    const onChange = (e) => {
        setSymbolInput(e.target.value.toUpperCase());
    };

    // symbol imput handler
    const onSubmit = async (e) => {
        e.preventDefault();
        inputRef.current.blur();

        //validate before submitting
        if (symbolInput.trim() === '') {
            setSymbol('');
            setErrorMessage('Symbol cannot be blank');
        } else {
            setErrorMessage('');
            processSymbol(symbolInput);
        }
    };

    return (
        <div className='technical-container'>
            <div className='symbol-input-containter'>
                <form onSubmit={onSubmit}>
                    <div className='form-row'>
                        <input
                            ref={inputRef}
                            type='text'
                            id='inputStockSymbol'
                            name='symbol'
                            className='form-control form-control-sm symbol-input input'
                            placeholder='Enter Symbol...'
                            value={symbolInput}
                            onChange={onChange}
                        />
                        <button type='submit' name='submit' className='btn btn-sm btn-go'>
                            <i className='fa fa-play'></i>
                        </button>
                    </div>
                    <h6 className='small text-danger'>{errorMessage !== '' && errorMessage}</h6>
                </form>
                <div className='recent-symbol-buttons'>
                    {sectors.length > 0 && <RecentSymbols symbols={sectors} handleRecenSymbol={handleRecenSymbol} />}
                    {!openPositionsLoading && <RecentSymbols symbols={openPositions} handleRecenSymbol={handleRecenSymbol} />}
                    {recentSymbols?.length > 0 && <RecentSymbols symbols={recentSymbols} handleRecenSymbol={handleRecenSymbol} />}
                </div>
            </div>
            {!loading && daily.hasOwnProperty('Time Series (Daily)') ? (
                <>
                    {!marketLoading && <SymbolDetail symbol={symbol} data={quote} />}
                    <CandleChart symbol={symbol} data={daily['Time Series (Daily)']} />
                    {!historyLoading && <ComparisonChart symbol={symbol} history={historyData} data={daily['Time Series (Daily)']} />}
                </>
            ) : (
                <h3>loading</h3>
            )}
        </div>
    );
};

Technical.propTypes = {
    getDaily: PropTypes.func.isRequired,
    getHistoryData: PropTypes.func.isRequired,
    getQuote: PropTypes.func.isRequired,
    getOpenPositions: PropTypes.func.isRequired,
    alphaVantage: PropTypes.object.isRequired,
    damwidi: PropTypes.object.isRequired,
    market: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    alphaVantage: state.alphaVantage,
    damwidi: state.damwidi,
    market: state.market,
});

export default connect(mapStatetoProps, { getDaily, getHistoryData, getQuote, getOpenPositions })(Technical);

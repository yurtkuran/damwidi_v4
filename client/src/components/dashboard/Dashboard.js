import React, { useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

// bring in dependencies
import './Dashboard.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import IndexCard from './IndexCard';
import IndexGauge from './IndexGauge';
import Heatmap from './Heatmap';
import PieChart from './PieChart';
import PortfolioTable from './PortfolioTable';

// bring in actions
import { getDashboardData } from '../../actions/damwidiActions';
import { getOpenPositions } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state
let symbols = ['QQQ', 'DIA', 'SPY'];
let ws = {};

const calculateDamwidiValue = (openPositions, prices, positions, fundQuote) => {
    let damValue = Number(fundQuote?.latestPrice);
    let realTime = false;
    const fallbackPrices = new Map((positions || []).map((position) => [position.symbol, position.last]));

    if (!Number.isFinite(damValue)) {
        return { validPrice: false };
    }

    for (const key in openPositions) {
        const { symbol, shares } = openPositions[key];

        if (
            prices?.[symbol] !== undefined &&
            prices?.[symbol].price !== 0 &&
            fallbackPrices.has(symbol)
        ) {
            realTime = true;
            damValue += shares * (prices[symbol].price - fallbackPrices.get(symbol));
        }
    }
    return { damValue, realTime, validPrice: true };
};

const Dashboard = ({
    auth: { isAuthenticated, loading: authLoading, user },
    damwidi: { dashboardData, dashboardError, dashboardLoading, openPositions, openPositionsLoading },
    getDashboardData,
    getOpenPositions,
}) => {
    // state
    const [indexReturn, setIndexReturn] = useState([]);
    const [propPrices, setPropPrices] = useState({});
    const prices = useRef(0);

    // create websocked connection
    useEffect(() => {
        // create connection
        ws = new WebSocket('wss://ws.finnhub.io?token=btijeh748v6ula7ekfr0');

        // update symbol array
        if (!openPositionsLoading) {
            // merge indicies and open positions
            openPositions.forEach((position) => {
                if (!symbols.includes(position.symbol) && position.type !== 'C') symbols.push(position.symbol);
            });

            // connection opened,  subscribe to symbols
            ws.addEventListener('open', function (event) {
                symbols.forEach((symbol) => {
                    ws.send(JSON.stringify({ type: 'subscribe', symbol }));
                });
            });
        }

        // listen for messages
        ws.addEventListener('message', function (event) {
            const { data, type } = JSON.parse(event.data);

            if (type.toUpperCase() === 'TRADE') {
                data.forEach((trade) => {
                    // console.log(trade.s, trade.p, moment(trade.t).format('YYYY-MM-DD HH:mm:ss.SSS'));
                    prices.current = { ...prices.current, [trade.s]: { price: trade.p, time: trade.t } };
                });
            }
        });

        return () => {
            ws.close();
        };
    }, [openPositionsLoading, openPositions]);

    // update state every 1s
    useEffect(() => {
        let interval;
        if (ws.readyState === 1) {
            console.log('socket connected');
            interval = setInterval(() => {
                setPropPrices({ SPY: prices.current['SPY'], QQQ: prices.current['QQQ'], DIA: prices.current['DIA'] });

                const { damValue: DAM, validPrice, realTime } = calculateDamwidiValue(
                    openPositions,
                    prices.current,
                    dashboardData?.positions,
                    dashboardData?.fundQuote
                );
                if (validPrice && realTime) {
                    // console.log(`${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss.SSS')} - ${numeral(DAM).format('$0,0.00')}`);
                    setPropPrices((prevPrices) => {
                        return { ...prevPrices, DAM: { price: DAM, time: Date.now() } };
                    });
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [dashboardData, openPositions, prices]);

    // load dashboard and open positions data when component loads
    useEffect(() => {
        getDashboardData();
        getOpenPositions();
    }, [getDashboardData, getOpenPositions]);

    // handler for index returns
    const handleSetIndex = useCallback(
        (index, gain) => {
            setIndexReturn((prevIndexData) => {
                return { ...prevIndexData, [index]: gain };
            });
        },
        [setIndexReturn]
    );

    return (
        <div style={divStyle}>
            <h4>dashboard</h4>
            {!authLoading && isAuthenticated && (
                <div className='dashboad-wrapper'>
                    {!dashboardLoading && dashboardData && (
                        <>
                            <div className='indices'>
                                <IndexGauge indexReturn={indexReturn} trades={propPrices} />
                                <IndexCard index={'DAM'} label={'damwidi'} handleSetIndex={handleSetIndex} initialQuote={dashboardData.indexQuotes.DAM} trade={propPrices['DAM']} />
                                <IndexCard index={'SPY'} label={'S&P 500'} handleSetIndex={handleSetIndex} initialQuote={dashboardData.indexQuotes.SPY} trade={propPrices['SPY']} />
                                <IndexCard index={'QQQ'} label={'NASDAQ'} handleSetIndex={handleSetIndex} initialQuote={dashboardData.indexQuotes.QQQ} trade={propPrices['QQQ']} />
                                <IndexCard index={'DIA'} label={'DOW 30'} handleSetIndex={handleSetIndex} initialQuote={dashboardData.indexQuotes.DIA} trade={propPrices['DIA']} />
                            </div>
                            <div className='charts charts-primary'>
                                <Heatmap
                                    movers={dashboardData.movers}
                                    title={moment(dashboardData.asOf).format('YYYY-MM-DD hh:mm:ss')}
                                />
                                <PieChart data={dashboardData.allocationSummary} />
                            </div>
                            {user !== null && user.isMember !== null && user.isMember && (
                                <div className='portfolio-table'>
                                    <PortfolioTable data={dashboardData.positions} fundQuote={dashboardData.fundQuote} />
                                </div>
                            )}
                        </>
                    )}
                    {!dashboardLoading && dashboardError && <p>unable to load dashboard data</p>}
                </div>
            )}
        </div>
    );
};

const divStyle = {
    marginTop: '4rem',
};

Dashboard.propTypes = {
    getDashboardData: PropTypes.func.isRequired,
    getOpenPositions: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
    auth: state.auth,
});

export default connect(mapStatetoProps, { getDashboardData, getOpenPositions })(Dashboard);

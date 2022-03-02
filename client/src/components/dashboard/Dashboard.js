import React, { useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

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
import { getIntraDayData } from '../../actions/damwidiActions';
import { getOpenPositions } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state
let symbols = ['QQQ', 'DIA', 'SPY'];
let ws = {};

const calculateDamwidiValue = (openPositions, prices, intraDay) => {
    let damValue = 0;
    let validPrice = true;
    let realTime = false;

    for (const key in openPositions) {
        const { symbol, shares } = openPositions[key];

        if (prices?.[symbol] !== undefined && prices?.[symbol].price !== 0) {
            realTime = true;
            damValue += shares * prices?.[symbol].price;
        } else if (intraDay?.[symbol].last !== undefined && intraDay?.[symbol].last !== 0) {
            damValue += shares * intraDay?.[symbol].last;
        } else {
            validPrice = false;
            return { validPrice };
        }
    }
    return { damValue, realTime, validPrice };
};

const Dashboard = ({
    auth: { isAuthenticated, loading: authLoading, user },
    damwidi: { intraDay, loading, openPositions, openPositionsLoading },
    getIntraDayData,
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

                const { damValue: DAM, validPrice, realTime } = calculateDamwidiValue(openPositions, prices.current, intraDay.allocationTable);
                if (validPrice && realTime) {
                    // console.log(`${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss.SSS')} - ${numeral(DAM).format('$0,0.00')}`);
                    setPropPrices((prevPrices) => {
                        return { ...prevPrices, DAM: { price: DAM, time: Date.now() } };
                    });
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [openPositions, prices, intraDay]);

    // load damwidi intraday & open positions data when component loads
    useEffect(() => {
        getIntraDayData();
        getOpenPositions();
    }, [getIntraDayData, getOpenPositions]);

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
                    <div className='indices'>
                        <IndexGauge indexReturn={indexReturn} trades={propPrices} />
                        <IndexCard index={'DAM'} label={'damwidi'} handleSetIndex={handleSetIndex} trade={propPrices['DAM']} />
                        <IndexCard index={'SPY'} label={'S&P 500'} handleSetIndex={handleSetIndex} trade={propPrices['SPY']} />
                        <IndexCard index={'QQQ'} label={'NASDAQ'} handleSetIndex={handleSetIndex} trade={propPrices['QQQ']} />
                        <IndexCard index={'DIA'} label={'DOW 30'} handleSetIndex={handleSetIndex} trade={propPrices['DIA']} />
                    </div>
                    {!loading && (
                        <>
                            <div className='charts charts-primary'>
                                <Heatmap
                                    categories={intraDay.graphHeatMap.labels}
                                    data={intraDay.graphHeatMap.datasets[0].data}
                                    title={intraDay.time}
                                    portfolio={intraDay.portfolioTable}
                                />
                                <PieChart data={intraDay.allocationTable} />
                            </div>
                            {user !== null && user.isMember !== null && user.isMember && (
                                <div className='portfolio-table'>
                                    <PortfolioTable data={intraDay.heatMapData} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const divStyle = {
    marginTop: '4rem',
};

Dashboard.propTypes = {
    getIntraDayData: PropTypes.func.isRequired,
    getOpenPositions: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
    auth: state.auth,
});

export default connect(mapStatetoProps, { getIntraDayData, getOpenPositions })(Dashboard);

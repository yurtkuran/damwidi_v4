import React, { useEffect, useState, useRef } from 'react';
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
import { getPerformance, getOpenPositions, realTimeUpdate } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state
let symbols = ['QQQ', 'DIA', 'SPY'];
let ws = {};

const calculateDamwidiValue = (sectors, prices, quotes) => {
    let damValue = 0;
    let validPrice = true;
    let realTime = false;

    // loop through sectors
    for (const sector of sectors) {
        const { symbol, shares } = sector;
        if (sector.type === 'C') {
            damValue += parseFloat(sector.basis); // add in cash
        } else if (sector.type !== 'F' && sector.shares > 0) {
            if (prices?.[symbol] !== undefined && prices?.[symbol].price !== 0) {
                realTime = true;
                damValue += shares * prices?.[symbol].price;
            } else if (quotes?.[symbol] !== undefined && quotes?.[symbol].price !== 0) {
                damValue += shares * quotes?.[symbol].price;
            } else {
                return { validPrice: false };
            }
        }
    }
    return { damValue: Math.round((damValue + Number.EPSILON) * 100) / 100, realTime, validPrice };
};

const Dashboard = ({
    auth: { isAuthenticated, loading: authLoading, user },
    damwidi: { performance: sectors, prices: quotes, loading, openPositions, openPositionsLoading },
    getPerformance,
    getOpenPositions,
    realTimeUpdate,
}) => {
    // state
    const [propPrices, setPropPrices] = useState({});
    const prices = useRef(0);
    // console.log(propPrices);

    // load damwidi perforamce, batch quote & open positions data when component loads
    useEffect(() => {
        getPerformance();
        getOpenPositions();
    }, [getPerformance, getOpenPositions]);

    // calculate DAM price
    useEffect(() => {
        if (!loading) {
            setPropPrices(quotes);
            const { damValue: DAM, validPrice, realTime } = calculateDamwidiValue(sectors, {}, quotes);
        }
    }, [loading]);

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
        if (ws.readyState === 1 && !loading) {
            console.log('socket connected');
            interval = setInterval(() => {
                let rtPrices = {};
                for (const symbol in prices.current) {
                    rtPrices = {
                        ...rtPrices,
                        [symbol]: { ...quotes[symbol], price: prices.current[symbol].price, time: prices.current[symbol].time },
                    };
                }
                realTimeUpdate({ ...quotes, ...rtPrices });

                // setPropPrices((prevPrices) => {
                //     let rtPrices = {};
                //     for (const symbol in prices.current) {
                //         // console.log({ symbol, prices: prices.current[symbol] });
                //         rtPrices = {
                //             ...rtPrices,
                //             [symbol]: { ...prevPrices[symbol], price: prices.current[symbol].price, time: prices.current[symbol].time },
                //         };
                //     }
                //     realTimeUpdate({ ...prevPrices, ...rtPrices });
                //     return { ...prevPrices, ...rtPrices };
                // });
                // update prices state
                // let rtPrices = {};
                // for (const symbol in prices.current) {
                //     rtPrices = {
                //         ...rtPrices,
                //         [symbol]: { ...propPrices[symbol], price: prices.current[symbol].price, time: prices.current[symbol].time },
                //     };
                //     // console.log(rtPrices);
                //     console.log(loading);
                // }
                // setPropPrices((prevPrices) => {
                //     return { ...prevPrices, ...rtPrices };
                // });
                // setPropPrices((prevPrices) => {
                //     return { ...prevPrices };
                // });
                // const { damValue: DAM, validPrice, realTime } = calculateDamwidiValue(openPositions, prices.current, intraDay.allocationTable);
                // if (validPrice && realTime) {
                //     // console.log(`${moment(Date.now()).format('YYYY-MM-DD HH:mm:ss.SSS')} - ${numeral(DAM).format('$0,0.00')}`);
                //     setPropPrices((prevPrices) => {
                //         return { ...prevPrices, DAM: { price: DAM, time: Date.now() } };
                //     });
                //     // update state for portfolio table
                //     realTimeUpdate(prices.current);
                // }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [openPositions, loading]);

    return (
        <div style={divStyle}>
            <h4>dashboard</h4>
            {!authLoading && isAuthenticated && (
                <div className='dashboad-wrapper'>
                    {!loading && (
                        <>
                            <div className='indices'>
                                <IndexGauge damData={quotes['DAM']} spyData={quotes['SPY']} />
                                <IndexCard index={'DAM'} label={'damwidi'} data={quotes['DAM']} />
                                <IndexCard index={'SPY'} label={'S&P 500'} data={quotes['SPY']} />
                                <IndexCard index={'QQQ'} label={'NASDAQ'} data={quotes['QQQ']} />
                                <IndexCard index={'DIA'} label={'DOW 30'} data={quotes['DIA']} />
                            </div>

                            <div className='charts charts-primary'>
                                <Heatmap />
                                {/* <PieChart /> */}
                            </div>

                            {user !== null && user.isMember !== null && user.isMember && (
                                <div className='portfolio-table'>
                                    <PortfolioTable sectors={sectors} prices={quotes} />
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
    getPerformance: PropTypes.func.isRequired,
    getOpenPositions: PropTypes.func.isRequired,
    realTimeUpdate: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
    auth: state.auth,
});

export default connect(mapStatetoProps, { getPerformance, getOpenPositions, realTimeUpdate })(Dashboard);

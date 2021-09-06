import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';

// bring in redux
import { connect } from 'react-redux';

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state
const initialChartOptions = {
    chart: {
        type: 'candlestick',
        height: 360,
        plotBorderColor: '#e6e6e6',
        plotBorderWidth: 1,
    },

    credits: {
        enabled: false,
    },

    exporting: {
        enabled: false,
    },

    navigator: {
        enabled: false,
    },

    rangeSelector: {
        enabled: false,
    },

    scrollbar: {
        enabled: false,
    },

    time: {
        timezoneOffset: new Date().getTimezoneOffset(),
    },

    title: {
        text: null,
    },

    tooltip: {
        split: true,
    },

    xAxis: {
        lineColor: '#e6e6e6',
        lineWidth: 2,
        labels: {
            style: {
                color: '#333333',
                fontSize: '10px',
            },
        },
    },

    yAxis: [
        {
            labels: {
                align: 'right',
                x: -5,
                style: {
                    color: '#333333',
                    fontSize: '10px',
                },
            },
            title: {
                text: 'OHLC',
            },
            lineColor: '#999999',
            lineWidth: 2,
            minPadding: 0.2,
            resize: {
                enabled: true,
                lineWidth: 0,
            },
        },
    ],

    series: [
        {
            type: 'candlestick',
            color: '#ff0000',
            name: 'Price',
            id: 'Price',
            // pointWidth: 38,
            pointPadding: 0.1,
            dataGrouping: {
                groupPixelWidth: 20,
            },
        },
    ],
};

const Candlestick = ({ symbol, type, simple }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);
    const [loading, setLoading] = useState(true);

    // load when component loads
    useEffect(() => {
        // console.log(symbol, type, simple);

        const loadData = async () => {
            try {
                const res = await axios.get(`api/marketData/intraday/${symbol}`);

                setChartOptions({
                    ...initialChartOptions,
                    series: initialChartOptions.series.map((series, i) => {
                        return i === 0 ? { ...series, data: res.data } : { ...series };
                    }),
                });

                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };

        loadData();
    }, [symbol, type, simple]);

    return loading ? (
        <h3>loading</h3>
    ) : (
        <div className='chart candlestick-wrapper'>
            {/* {symbol} Candlestick Chart: {simple ? 'simple' : 'complex'} */}
            <div className='candlestick'>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} constructorType={'stockChart'} />
            </div>
        </div>
    );
};

Candlestick.propTypes = {
    market: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    market: state.market,
});

export default connect(mapStatetoProps, null)(Candlestick);

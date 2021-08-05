import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts from 'highcharts/highstock';
import exportingModule from 'highcharts/modules/exporting';
import indicators from 'highcharts/indicators/indicators';
import bb from 'highcharts/indicators/bollinger-bands';
import HighchartsReact from 'highcharts-react-official';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state
const initialChartOptions = {
    chart: {
        height: '600px',
    },

    rangeSelector: {
        selected: 2,
    },

    yAxis: [
        {
            labels: {
                align: 'right',
                x: -3,
            },
            title: {
                text: 'OHLC',
            },
            height: '60%',
            lineWidth: 2,
            resize: {
                enabled: true,
            },
            crosshair: {
                snap: false,
                color: '#5b5b5b',
            },
        },
        {
            labels: {
                align: 'right',
                x: -3,
            },
            title: {
                text: 'Volume',
            },
            top: '65%',
            height: '35%',
            offset: 0,
            lineWidth: 2,
        },
    ],

    tooltip: {
        split: true,
    },

    plotOptions: {
        candlestick: {
            color: '#ff0000',
        },
        bb: {
            color: '#0040ff',
            lineWidth: 1,
            dashStyle: 'ShortDash',
            bottomLine: {
                styles: {
                    lineWidth: 3,
                },
            },
            topLine: {
                styles: {
                    lineWidth: 3,
                },
            },
            enableMouseTracking: false,
        },
        sma: {
            index: 3,
            enableMouseTracking: false,
            lineWidth: 3,
            marker: {
                enabled: false,
            },
        },
        line: {
            color: '#26a833',
            lineWidth: 3,
            enableMouseTracking: false,
        },
    },
};

// init highcharts  modules
exportingModule(Highcharts);
indicators(Highcharts);
bb(Highcharts);

const CandleChart = ({ symbol, data }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // state for candle data
    const [loading, setLoading] = useState(true);

    // configure data when component loads
    useEffect(() => {
        // candle data
        let ohlc = [];
        for (const key in data) {
            ohlc.push([
                Date.parse(key), // date
                // key,
                parseFloat(data[key]['1. open']), // open
                parseFloat(data[key]['2. high']), // high
                parseFloat(data[key]['3. low']), // low
                parseFloat(data[key]['4. close']), // close
            ]);
        }

        // calculate sma(3,3)
        let sma3 = [];
        for (let i = 0; i < ohlc.length - 4; i++) {
            let sum = 0;
            for (let j = 0; j < 3; j++) {
                sum += ohlc.slice(i + j + 2, i + j + 3)[0][4];
            }
            sma3.push([ohlc.slice(i, i + 1)[0][0], sum / 3]);
        }

        // volume data
        let volume = [];
        for (const key in data) {
            volume.push([
                Date.parse(key), // date
                parseFloat(data[key]['5. volume']), // close
            ]);
        }

        setChartOptions({
            yAxis: [
                {
                    height: symbol.toUpperCase() === 'DAM' ? '100%' : '65%',
                },
                {
                    height: symbol.toUpperCase() === 'DAM' ? '0%' : '35%',
                    title: {
                        text: symbol.toUpperCase() === 'DAM' ? '' : 'Volume',
                    },
                },
            ],
            series: [
                {
                    type: 'candlestick',
                    id: 'candle',
                    data: ohlc.reverse(),
                    // dataGrouping: {
                    //     units: groupingUnits,
                    // },
                },
                {
                    type: 'bb',
                    linkedTo: 'candle',
                },
                {
                    type: 'sma',
                    linkedTo: 'candle',
                    color: '#FF8040',
                    params: {
                        period: 50,
                        index: 3,
                    },
                },
                {
                    type: 'sma',
                    linkedTo: 'candle',
                    color: '#000000',
                    params: {
                        period: 200,
                        index: 3,
                    },
                },
                {
                    type: 'sma',
                    linkedTo: 'candle',
                    color: '#ff0000',
                    params: {
                        period: 2,
                        index: 3,
                    },
                },
                {
                    type: 'line',
                    linkedTo: 'candle',
                    data: sma3.reverse(),
                },

                {
                    type: 'column',
                    name: 'Volume',
                    data: volume.reverse(),
                    yAxis: 1,
                    // dataGrouping: {
                    //     units: groupingUnits,
                    // },
                },
            ],
        });
    }, [data]);

    return (
        <div>
            <div className='candle-chart-container'>
                <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={chartOptions} />
            </div>
        </div>
    );
};

CandleChart.propTypes = {
    data: PropTypes.object.isRequired,
    symbol: PropTypes.string.isRequired,
};

export default CandleChart;

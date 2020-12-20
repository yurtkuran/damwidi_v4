import React, { useState } from 'react';

// bring in dependencies
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// bring in redux

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions

// bring in functions and hooks

// set initial state

// chart options
require('highcharts/highcharts-more')(Highcharts);
const initialChartOptions = {
    chart: {
        type: 'gauge',
        height: 170,
        width: 200,
        borderWidth: 0,
        backgroundColor: 'rgba(210, 210, 210, 0.6)',
        styledMode: false,
    },

    title: {
        text: null,
    },

    exporting: {
        enabled: false,
    },

    pane: {
        startAngle: -150,
        endAngle: 150,
        size: '95%',
        background: [
            {
                backgroundColor: '#eee',
            },
            {
                backgroundColor: '#000',
                borderWidth: 0,
                outerRadius: '105%',
                innerRadius: '103%',
            },
        ],
    },

    plotOptions: {
        className: 'index-gauage-dial',
        dataLabels: {
            enabled: false,
        },
    },

    // the value axis
    yAxis: {
        min: -2,
        max: 2,
        minorTickInterval: null,
        tickInterval: 0.5,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: {
            step: 2,
            format: '{value}%',
            rotation: 'auto',
        },
        plotBands: [
            {
                from: -2,
                to: 0,
                color: '#DF5353', // red
            },
            {
                from: 0,
                to: 2,
                color: '#55BF3B', // green
            },
        ],
    },

    series: [
        {
            data: [1],
        },
    ],
};

const IndexGauge = ({ indexReturn: { DAM, SPY } }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // return !(DAM && SPY) ? (
    return false ? (
        <Spinner />
    ) : (
        <div className='index-gauge'>
            <div className='gauge-wrapper'>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>
        </div>
    );
};

export default IndexGauge;

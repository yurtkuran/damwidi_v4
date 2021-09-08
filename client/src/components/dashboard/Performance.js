import React, { useState } from 'react';

// bring in dependencies
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state
const initialChartOptions = {
    chart: {
        type: 'bar',
        height: 360,
    },
    title: {
        // text: 'Performance Since Purchase',
        text: null,
        style: { fontFamily: 'Josefin Sans', color: '#333333', fontSize: '15px' },
    },
    xAxis: {
        categories: [],
    },
    yAxis: [
        {
            labels: {
                format: '{value} %',
            },
            title: {
                text: null,
            },
        },
    ],
    legend: {
        shadow: false,
        enabled: false,
    },
    tooltip: {
        shared: true,
        valueSuffix: '%',
    },
    exporting: {
        enabled: true,
        buttons: {
            contextButton: {
                menuItems: ['downloadPNG', 'downloadJPEG'],
            },
        },
    },
    plotOptions: {
        bar: {
            grouping: false,
            shadow: false,
            borderWidth: 0,
        },
    },
    series: [
        {
            name: 'Position',
            color: 'rgba(0,0,0,0.1)',
            data: [],
            pointPadding: 0.3,
            pointPlacement: 0.0,
            pointWidth: 14,
            animation: {
                duration: 300,
            },
        },
        {
            name: 'SPY',
            color: 'rgba(0,0,0,0.5)',
            data: [],
            pointPadding: 0.4,
            pointPlacement: 0.0,
            pointWidth: 6,
            animation: {
                duration: 300,
                defer: 200,
            },
        },
    ],
};

// init highcharts export module
Highcharts_exporting(Highcharts);

const Performance = ({ seriesPrice, seriesSPY, categories }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // chart callback
    const afterChartCreated = (chart) => {
        const processedData = seriesPrice.map((val) => ({
            y: val,
            color: val < 0 ? 'rgba(209, 58, 58, 0.5)' : 'rgba(18, 143, 4, 0.5)',
        }));

        setChartOptions({
            xAxis: {
                categories: categories,
            },
            series: [
                {
                    data: processedData,
                },
                {
                    data: seriesSPY,
                },
            ],
        });

        chart.redraw();
        // chart.reflow();
    };

    return (
        <div className='chart performance-wrapper'>
            <div className='performance'>
                <div>Performance Since Purchase</div>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} callback={afterChartCreated} />
            </div>
        </div>
    );
};

Performance.propTypes = {
    seriesPrice: PropTypes.array.isRequired,
    seriesSPY: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
};

export default Performance;

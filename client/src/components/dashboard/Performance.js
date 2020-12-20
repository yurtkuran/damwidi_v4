import React, { useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';

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
            pointPlacement: -0.2,
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
            pointPlacement: -0.2,
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

const Performance = ({ loading, intraDay }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // chart callback
    const afterChartCreated = (chart) => {
        const { seriesPrice, seriesSPY, categories } = intraDay.performanceData;

        // update chart
        chart.series[0].setData(seriesPrice);
        chart.series[1].setData(seriesSPY);
        chart.xAxis[0].setCategories(categories);

        // update bar colors
        for (let i = 0; i < chart.series[0].data.length; i++) {
            chart.series[0].data[i].update(
                {
                    color: chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 0.5)' : 'rgba(18, 143, 4, 0.5)',
                },
                false
            );
        }
        chart.redraw();
        chart.reflow();
    };

    return loading ? (
        <Spinner />
    ) : (
        <div className='chart performance-wrapper'>
            <div className='performance'>
                <div>Performance Since Purchase</div>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} callback={afterChartCreated} />
            </div>
        </div>
    );
};

Performance.propTypes = {
    intraDay: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
};

const mapStatetoProps = (state) => ({
    intraDay: state.damwidi.intraDay,
    loading: state.damwidi.loading,
});

export default connect(mapStatetoProps, null)(Performance);

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts, { chart } from 'highcharts/highstock';
import exportingModule from 'highcharts/modules/exporting';
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

    yAxis: {
        labels: {
            formatter: function () {
                return (this.value > 0 ? ' + ' : '') + this.value + '%';
            },
        },
        plotLines: [
            {
                value: 0,
                width: 2,
                color: 'silver',
            },
        ],
    },

    legend: {
        enabled: true,
    },

    plotOptions: {
        series: {
            compare: 'percent',
            showInNavigator: true,
        },
    },

    navigator: {
        enabled: false,
    },

    tooltip: {
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
        valueDecimals: 2,
        split: true,
    },
};

const ComparisonChart = ({ symbol, history, data }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // configure data when component loads
    useEffect(() => {
        console.log(initialChartOptions.series);
        const { spy, value: dam } = history;
        let series = [];

        // SPY data
        const spyData = spy.map((point) => [Date.parse(point.date), parseFloat(point.close)]);
        series.push({
            name: 'SPY',
            data: spyData,
            color: 'rgba(0, 0, 0, .5)',
            lineWidth: 2,
            dashStyle: 'ShortDash',
        });

        // DAM data
        const damData = dam.map((point) => [Date.parse(point.date), parseFloat(point.close)]);
        series.push({
            name: 'DAM',
            data: damData,
            color: 'rgba(57, 122, 152, 0.934)',
            lineWidth: 2,
        });

        // comparison data
        let compData = [];
        for (const key in data) {
            compData.push([
                Date.parse(key), // date
                parseFloat(data[key]['4. close']), // close
            ]);
        }
        series.push({
            name: symbol.toUpperCase(),
            data: compData.reverse(),
            color: 'rgba(0, 123, 255, 1)',
        });

        setChartOptions({
            rangeSelector: {
                selected: 2,
            },
            series,
        });
    }, [history, data]);

    return (
        <div className='comparison-chart-container'>
            <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={chartOptions} />
        </div>
    );
};

ComparisonChart.propTypes = {
    history: PropTypes.object.isRequired,
};

export default ComparisonChart;

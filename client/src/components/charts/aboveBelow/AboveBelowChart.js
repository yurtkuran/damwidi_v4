import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
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
        type: 'spline',
        height: 400,
        width: 1100,
    },
    title: {
        text: null,
        style: { fontFamily: 'Josefin Sans', color: '#333333', fontSize: '15px' },
    },
    xAxis: {
        categories: [],
    },
    yAxis: [
        {
            title: {
                text: null,
            },
        },
    ],
    legend: {
        shadow: false,
        enabled: true,
        floating: false,
        itemHoverStyle: {
            color: null,
        },
    },
    tooltip: {
        shared: false,
        formatter: function () {
            return `${this.series.name}`;
        },
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
        series: {
            states: {
                hover: {
                    enabled: false,
                },
                select: {
                    enabled: false,
                },
                inactive: {
                    enabled: false,
                },
            },
            linecap: 'square',
            marker: {
                enabled: false,
            },
        },
    },
};

// init highcharts export module
Highcharts_exporting(Highcharts);

const AboveBelowChart = ({ title, labels, data, chartConfig }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // update chart options when component loads
    useEffect(() => {
        const formatCount = chartConfig.length - 1;
        const processData = data.map(({ label: name, symbol, data }, idx) => {
            const formatIdx = idx <= formatCount ? idx : formatCount;
            const { weight, dashstyle, color } = chartConfig[formatIdx];
            return {
                lineWidth: symbol === 'SPY' ? 4 : weight,
                dashStyle: symbol === 'SPY' ? 'solid' : dashstyle,
                color: symbol === 'SPY' ? `rgba(0,0,0,1)` : `rgba(${color})`,
                showInLegend: symbol === 'SPY' ? false : true,
                name,
                data,
            };
        });

        setChartOptions({
            xAxis: {
                categories: labels,
            },
            yAxis: [
                {
                    labels: {
                        format: `${title === 'relative strength' ? '{value:.0f}%' : '{value:.2f}%'} `,
                    },
                },
            ],
            series: processData,
        });
    }, [chartConfig, data, labels, title]);

    return (
        <div className='above-below-chart'>
            <h6 className='chart-title'>{title}</h6>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
    );
};

AboveBelowChart.propTypes = {
    title: PropTypes.string.isRequired,
    labels: PropTypes.array.isRequired,
    data: PropTypes.array.isRequired,
    chartConfig: PropTypes.object.isRequired,
};

export default AboveBelowChart;

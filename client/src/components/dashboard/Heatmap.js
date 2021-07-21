import React, { useState } from 'react';

// bring in dependencies
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

// init highcharts export module
Highcharts_exporting(Highcharts);

const Heatmap = ({ title, categories, data, portfolio }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState({
        chart: {
            type: 'column',
            height: 360,
        },
        title: {
            text: null,
            style: { fontFamily: 'Josefin Sans', color: '#333333', fontSize: '15px' },
        },
        plotOptions: {
            column: {
                animation: {
                    duration: 300,
                },
            },
            series: {
                borderWidth: 1,
            },
        },
        xAxis: {
            categories,
            labels: {
                formatter: function () {
                    if (this.value === 'DAM') {
                        return '<span style="font-weight: bold; color: black">' + this.value + '</span>';
                    } else {
                        return this.value;
                    }
                },
            },
        },
        yAxis: [
            {
                labels: {
                    format: '{value:.1f} %',
                },
                title: {
                    text: null,
                },
                plotLines: [
                    // make y axis bold
                    {
                        color: '#000000',
                        width: 2,
                        value: 0,
                    },
                ],
            },
        ],
        legend: {
            shadow: false,
            enabled: false,
        },
        tooltip: {
            pointFormat: '<b>{point.y:.2f}%</b><br/>',
            // formatter: function () {
            //     return this.x + ' : ' + '{point.y:.2f}%';
            // },
        },
        credits: {
            enabled: false,
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['downloadPNG', 'downloadJPEG'],
                },
            },
        },
        series: [
            {
                data,
                pointWidth: 14,
            },
        ],
    });

    // chart callback
    const afterChartCreated = (chart) => {
        for (let i = 0; i < chart.series[0].data.length; i++) {
            // add plot line at SPY value
            if (chart.series[0].data[i].category === 'SPY') {
                chart.xAxis[0].addPlotLine({
                    value: i,
                    color: 'rgba(200, 200, 200, 1)',
                    width: 2,
                    dashStyle: 'ShortDash',
                });
            }

            // set bar color on current holding and value
            if (Object.keys(portfolio).includes(chart.series[0].data[i].category)) {
                chart.series[0].data[i].update(
                    {
                        color: chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 1)' : 'rgba(18, 143, 4, 1)',
                        borderColor: chart.series[0].data[i].category === 'DAM' ? 'rgba(0, 0, 0, 1)' : chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 1)' : 'rgba(18, 143, 4, 1)',
                        borderWidth: chart.series[0].data[i].category === 'DAM' ? 3 : 1, // set border width for DAM column
                    },
                    true
                );
            } else {
                chart.series[0].data[i].update(
                    {
                        color: chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 0.3)' : 'rgba(18, 143, 4, 0.3)',
                        borderColor: chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 1)' : 'rgba(18, 143, 4, 1)',
                    },
                    false
                );
            }
        }
        chart.redraw();
    };

    return (
        <div className='chart heatmap-wrapper'>
            <div className='heatmap'>
                <div>Heatmap: {title}</div>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} oneToOne={true} callback={afterChartCreated} />
            </div>
        </div>
    );
};

export default Heatmap;

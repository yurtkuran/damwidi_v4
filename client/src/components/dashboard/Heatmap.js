import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import { gain } from '../../utils/round';

// bring in redux
import { connect } from 'react-redux';

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

// init highcharts export module
Highcharts_exporting(Highcharts);

const Heatmap = ({ performance, prices }) => {
    // state for chart data
    const [chartData, setChartData] = useState([]);
    const [openPositions, setOpenPositions] = useState([]);

    // format data when component loads
    useEffect(() => {
        let seriesData = [];
        for (const symbol in prices) {
            const { price, previousClose } = prices[symbol];
            seriesData.push({ symbol, gain: gain(price, previousClose) });
        }
        setChartData(seriesData.sort((a, b) => b.gain - a.gain));
    }, [prices]);

    useEffect(() => {
        let openPositions = performance.filter((position) => position.shares > 0).map((position) => position.symbol);
        openPositions.push('DAM');
        setOpenPositions(openPositions);
    }, [performance]);

    // state handler for chart options
    const chartOptions = {
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
            categories: chartData.map((position) => position.symbol),
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
                data: chartData.map((position) => position.gain),
                pointWidth: 12,
            },
        ],
    };

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
            if (openPositions.includes(chart.series[0].data[i].category)) {
                chart.series[0].data[i].update(
                    {
                        color: chart.series[0].data[i].negative ? 'rgba(209, 58, 58, 1)' : 'rgba(18, 143, 4, 1)',
                        borderColor:
                            chart.series[0].data[i].category === 'DAM'
                                ? 'rgba(0, 0, 0, 1)'
                                : chart.series[0].data[i].negative
                                ? 'rgba(209, 58, 58, 1)'
                                : 'rgba(18, 143, 4, 1)',
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
        chart.reflow();
    };

    return (
        <div className='chart heatmap-wrapper'>
            <div className='heatmap'>
                <div>Heatmap: insert title</div>
                {chartData.length > 0 && (
                    <HighchartsReact highcharts={Highcharts} options={chartOptions} oneToOne={true} callback={afterChartCreated} />
                )}
            </div>
        </div>
    );
};

Heatmap.propTypes = {
    performance: PropTypes.array.isRequired,
    prices: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    performance: state.damwidi.performance,
    prices: state.damwidi.prices,
});

export default connect(mapStatetoProps, null)(Heatmap);

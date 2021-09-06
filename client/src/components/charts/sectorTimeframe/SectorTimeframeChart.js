import React, { useEffect, useState } from 'react';

// bring in dependencies
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import Metrics from './Metrics';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state
const initialChartOptions = {
    chart: {
        type: 'bar',
        // height: 100+'%',
        height: 500,
        width: 196,
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
        formatter: function () {
            return `${this.x}:<br><b>${Math.round((this.y + Number.EPSILON) * 100) / 100}%</b>`;
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
            pointWidth: 12,
            animation: {
                duration: 300,
            },
        },
    ],
};

// init highcharts export module
Highcharts_exporting(Highcharts);

const SectorTimeframeChart = ({ timeframe, data }) => {
    const valueSPY = parseFloat(data.SPY[timeframe]);
    const valueDAM = parseFloat(data.DAM[timeframe]);

    const [arrowClass, setArrowClass] = useState('');

    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // set timeframe arrow and color
    useEffect(() => {
        setArrowClass(`${valueDAM > valueSPY ? 'fa-arrow-circle-up' : 'fa-arrow-circle-down'} ${valueDAM >= 0 ? 'arrowGreen' : 'arrowRed'}`);
    }, [valueDAM, valueSPY]);

    // chart callback
    const afterChartCreated = (chart) => {
        // build data
        let categories = [];
        let processedData = [];
        let firstSectorIdx = null;
        let lastSectorIdx = null;
        for (const sector in data) {
            categories.push(sector);
            const val = data[sector][timeframe];
            processedData.push({
                y: parseFloat(val),
                color: val < 0 ? 'rgba(209, 58, 58, 0.5)' : 'rgba(18, 143, 4, 0.5)',
            });

            if (firstSectorIdx === null) if (data[sector].type === 'S') firstSectorIdx = sector;
            if (firstSectorIdx !== null && lastSectorIdx === null) if (data[sector].type !== 'S') lastSectorIdx = sector;
        }

        setChartOptions({
            xAxis: {
                categories,
                plotLines: [
                    {
                        value: categories.findIndex((symbol) => symbol === firstSectorIdx) - 0.5,
                        color: 'rgba(0,0,0,0.3)',
                        width: 2,
                        dashStyle: 'ShortDash',
                    },
                    {
                        value: categories.findIndex((symbol) => symbol === lastSectorIdx) - 0.5,
                        color: 'rgba(0,0,0,0.3)',
                        width: 2,
                        dashStyle: 'ShortDash',
                    },
                ],
            },
            yAxis: {
                plotLines: [
                    {
                        value: data['SPY'][timeframe],
                        color: 'rgba(0, 0, 0, .5)',
                        width: 1,
                        dashStyle: 'ShortDash',
                    },
                    {
                        value: 0,
                        color: 'rgba(0,0,0,1)',
                        width: 1,
                        zIndex: 4,
                    },
                ],
            },
            series: [
                {
                    data: processedData,
                },
            ],
        });

        chart.redraw();
        // chart.reflow();
    };

    return (
        <div className='timeframe_chart'>
            <div className='timeframe_chart_header'>
                <h6>
                    {timeframe}
                    <i className={`fa ${arrowClass}`} />
                </h6>
                <div className='metrics'>
                    <Metrics value={valueDAM} label={'DAM'} />
                    <Metrics value={valueDAM - valueSPY} label={'A/B'} />
                </div>
            </div>
            <div className=''>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} oneToOne={true} callback={afterChartCreated} />
            </div>
        </div>
    );
};

export default SectorTimeframeChart;

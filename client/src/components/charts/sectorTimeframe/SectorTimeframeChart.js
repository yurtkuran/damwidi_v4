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
    const valueSPY = parseFloat(data.find(({ symbol }) => symbol === 'SPY')[timeframe]);
    const valueDAM = parseFloat(data.find(({ symbol }) => symbol === 'DAM')[timeframe]);

    // state handler for correct arrrow display
    const [arrowClass, setArrowClass] = useState('');

    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // set timeframe arrow and color
    useEffect(() => {
        setArrowClass(`${valueDAM > valueSPY ? 'fa-arrow-circle-up' : 'fa-arrow-circle-down'} ${valueDAM >= 0 ? 'arrowGreen' : 'arrowRed'}`);
    }, [valueSPY, valueDAM]);

    // chart callback
    const afterChartCreated = (chart) => {
        // build data
        let processedData = [];
        let firstSectorIdx = null;
        let lastSectorIdx = null;
        const categories = data.map((sector, idx) => {
            const { symbol, type } = sector;
            console.log(sector);

            // set series data
            const val = parseFloat(sector[timeframe]);
            console.log(val);
            processedData.push({
                y: val,
                color: val < 0 ? 'rgba(209, 58, 58, 0.5)' : 'rgba(18, 143, 4, 0.5)',
            });

            // set horizontal plot lines
            if (firstSectorIdx === null && type === 'S') firstSectorIdx = symbol;
            if (firstSectorIdx !== null && lastSectorIdx === null) if (type !== 'S') lastSectorIdx = symbol;

            return symbol;
        });

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
                        value: valueSPY,
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

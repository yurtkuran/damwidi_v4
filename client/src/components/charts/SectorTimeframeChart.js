import React, { useEffect, useState } from 'react';

// bring in dependencies
import axios from 'axios';
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

const SectorTimeframeChart = ({ timeframe }) => {
    const [loading, setLoading] = useState(true);
    const [timeframeData, setTimeframeData] = useState({});
    const [arrowClass, setArrowClass] = useState('');

    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // load timefrae data
    useEffect(() => {
        const loadTimeframeData = async () => {
            try {
                const res = await axios.get(`api/damwidi/timeframeData/${timeframe}`);
                setTimeframeData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };
        loadTimeframeData();
    }, [timeframe]);

    // set timeframe arrow and color
    useEffect(() => {
        if (timeframeData && Object.keys(timeframeData).length > 0 && timeframeData.constructor === Object) {
            const {
                labels,
                datasets: {
                    0: { data },
                },
            } = timeframeData;

            const idxSPY = labels.findIndex((symbol) => symbol === 'SPY');
            const valueSPY = parseFloat(data[idxSPY]);

            const idxDAM = labels.findIndex((symbol) => symbol === 'DAM');
            const valueDAM = parseFloat(data[idxDAM]);

            setArrowClass(`${valueDAM > valueSPY ? 'fa-arrow-circle-up' : 'fa-arrow-circle-down'} ${valueDAM >= 0 ? 'arrowGreen' : 'arrowRed'}`);
        }
    }, [timeframeData]);

    // chart callback
    const afterChartCreated = (chart) => {
        const {
            SPY,
            labels,
            datasets: {
                0: { data },
            },
        } = timeframeData;

        const processedData = data.map((val) => {
            return {
                y: parseFloat(val),
                color: val < 0 ? 'rgba(209, 58, 58, 0.5)' : 'rgba(18, 143, 4, 0.5)',
            };
        });

        setChartOptions({
            xAxis: {
                categories: labels,
                plotLines: [
                    {
                        value: labels.findIndex((symbol) => symbol === 'SPY') + 0.5,
                        color: 'rgba(0,0,0,0.3)',
                        width: 2,
                        dashStyle: 'ShortDash',
                    },
                ],
            },
            yAxis: {
                plotLines: [
                    {
                        value: SPY,
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
            <span>
                <h6>
                    {timeframe}
                    <i className={`fa ${arrowClass}`} />
                </h6>
            </span>
            <div className=''>{!loading && <HighchartsReact highcharts={Highcharts} options={chartOptions} oneToOne={true} callback={afterChartCreated} />}</div>
        </div>
    );
};

export default SectorTimeframeChart;

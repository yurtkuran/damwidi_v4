import React, { useState, useMemo } from 'react';

// bring in dependencies
import PropTypes from 'prop-types';
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

const Performance = ({ symbol, openPositions, prices }) => {
    // state for performance chart
    const [categories, setCategories] = useState([]);
    const [seriesPrice, setSeriesPrice] = useState([]);
    const [seriesSPY, setSeriesSPY] = useState([]);
    const [loading, setLoading] = useState(true);

    // format data when component loads
    useMemo(() => {
        openPositions[symbol].purchases.forEach(({ date, spyGain, priceBasis }) => {
            categories.push(date);
            seriesPrice.push(gain(prices[symbol].price, priceBasis));
            seriesSPY.push(spyGain);
        });
        setCategories(categories);
        setSeriesPrice(seriesPrice);
        setSeriesSPY(seriesSPY);
        setLoading(false);
    }, [symbol, openPositions, prices, categories, seriesPrice, seriesSPY]);

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
    };

    return (
        <div className='chart performance-wrapper'>
            <div className='performance'>
                <div>Performance Since Purchase</div>
                {!loading && <HighchartsReact highcharts={Highcharts} options={chartOptions} callback={afterChartCreated} />}
            </div>
        </div>
    );
};

Performance.propTypes = {
    symbol: PropTypes.string.isRequired,
    openPositions: PropTypes.object.isRequired,
    prices: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    openPositions: state.damwidi.openPositionsDetail,
    prices: state.damwidi.prices,
});

export default connect(mapStatetoProps, null)(Performance);

import React, { useEffect, useState } from 'react';

// bring in dependencies
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// create monochrome colors
const pieColors = (() => {
    let colors = [];
    // const base = Highcharts.getOptions().colors[0];
    const base = '#397a98';

    // console.log(base);

    for (let i = 0; i <= 12; i += 1) {
        // Start out with a darkened base color (negative brighten), and end
        // up with a much brighter color
        colors.push(
            Highcharts.color(base)
                .brighten((i - 1) / 13)
                .get()
        );
    }
    return colors;
})();

// set initial state
const initialChartOptions = {
    chart: {
        type: 'pie',
        height: 360,
        width: 360,
    },
    title: {
        text: null,
    },
    tooltip: {
        // pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>',
        formatter: function () {
            return `${this.point.name}: <b>${numeral(this.y).format('0.0')}%</b>`;
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
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            colors: pieColors,
            dataLabels: {
                enabled: true,
                useHTML: true,
                formatter: function () {
                    return `<div style="text-align: center">${this.point.name}<br>${numeral(this.point.y).format('0.0')}%</div>`;
                },
                distance: -50,
                filter: {
                    property: 'y',
                    operator: '>=',
                    value: 4,
                },
            },
        },
    },
    credits: {
        enabled: false,
    },
};

// init highcharts export module
Highcharts_exporting(Highcharts);

const PieChart = ({ data }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // format data when component loads
    useEffect(() => {
        let pieData = [];
        let others = 0;

        for (const item in data) {
            const { name, impliedPercent, allocation, type, symbol } = data[item];

            // add sectors and cash; SPY is allocated in these numbers
            if (type === 'Y' || type === 'C') {
                pieData.push({
                    name,
                    y: type === 'Y' ? Number.parseFloat(impliedPercent) : Number.parseFloat(allocation),
                });
            }

            // accumulate others (e.g. BRK.b)
            if (type === 'I' && symbol !== 'SPY') others += Number.parseFloat(allocation);
        }

        // add others (e.g. BRK.b)
        pieData.push({
            name: 'Other',
            y: others,
        });

        // sort arrary highest to lowest
        pieData.sort((a, b) => {
            return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
        });

        // seperate the largest slice
        pieData[0].sliced = true;
        console.log(pieData);

        setChartOptions({
            series: [
                {
                    data: pieData,
                },
            ],
        });
    }, [data]);
    return (
        <div className='chart'>
            <div>Allocation</div>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
    );
};

PieChart.propTypes = {
    data: PropTypes.object.isRequired,
};

export default PieChart;

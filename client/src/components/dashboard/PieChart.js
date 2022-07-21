import React, { useEffect, useState } from 'react';

// bring in dependencies
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import Highcharts_exporting from 'highcharts/modules/exporting';
import HighchartsReact from 'highcharts-react-official';
import numeral from 'numeral';

// bring in redux
import { connect } from 'react-redux';

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

const PieChart = ({ performance, prices }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // format data when component loads
    useEffect(() => {
        let sectors = {};

        //isolate SPY share data
        const spyIndex = performance.findIndex((sector) => sector.symbol === 'SPY');
        const spyShares = performance[spyIndex].shares;

        // determine sector list and value; allocate SPY according to sector weight
        performance
            .filter((sector) => sector.type === 'S')
            .map((sector) => {
                const { symbol, weight, shares, name } = sector;
                sectors[symbol] = {
                    symbol,
                    name,
                    impliedPercent: 100 * ((shares * prices[symbol].price + (weight / 100) * spyShares * prices.SPY.price) / prices.DAM.price),
                };
                return true;
            });

        // add in cash, stocks, ETF and other indices
        performance
            .filter((sector) => (sector.type !== 'S') & (sector.symbol !== 'SPY'))
            .map((position) => {
                const { symbol, type, name, sector, shares, basis } = position;
                switch (type) {
                    case 'C': //cash
                        sectors[symbol] = {
                            symbol,
                            name,
                            impliedPercent: 100 * (basis / prices.DAM.price),
                        };
                        break;
                    case 'K': // stock or ETF
                        let { impliedPercent } = sectors[sector];
                        sectors[sector] = {
                            ...sectors[sector],
                            impliedPercent: (impliedPercent += 100 * ((shares * prices[symbol].price) / prices.DAM.price)),
                        };
                        break;
                    case 'I': // other iondicies (e.g. KOMP, BRK.B)
                        position?.Other
                            ? (position.Other = {
                                  ...position[symbol],
                                  impliedPercent: (impliedPercent += 100 * ((shares * prices[symbol].price) / prices.DAM.price)),
                              })
                            : (position.Other = {
                                  name: 'Other',
                                  impliedPercent: 100 * ((shares * prices[symbol].price) / prices.DAM.price),
                              });
                        break;
                    default:
                        break;
                }

                return true;
            });

        let pieData = [];
        for (const sector in sectors) {
            const { name, impliedPercent } = sectors[sector];
            pieData.push({ name, y: impliedPercent });
        }

        // sort arrary highest to lowest
        pieData.sort((a, b) => {
            return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
        });

        // seperate the largest slice
        pieData[0].sliced = true;

        setChartOptions({
            series: [
                {
                    data: pieData,
                },
            ],
        });
    }, [performance, prices]);

    return (
        <div className='chart'>
            <div>Allocation</div>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
    );
};

PieChart.propTypes = {
    performance: PropTypes.array.isRequired,
    prices: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    performance: state.damwidi.performance,
    prices: state.damwidi.prices,
});

export default connect(mapStatetoProps, null)(PieChart);

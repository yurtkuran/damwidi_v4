import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import numeral from 'numeral';
import moment from 'moment';

// bring in components
import Spinner from '../layout/Spinner';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getUsage, getDetails } from '../../actions/iexActions';

const initialChartOptions = {
    chart: {
        type: 'column',
        animation: false,
        className: 'chartStyle',
        // width: 800,
        // height: (9 / 16) * 100 + '%', // 16:9 ratio
        height: 450,
    },
    title: {
        text: '',
    },
    series: [
        {
            data: [],
        },
    ],
    legend: {
        enabled: false,
    },
    plotOptions: {
        series: {
            animation: false,
        },
    },
};

const IEXStatus = ({ iex: { loadingUsage, usage, loadingDetails, details }, getUsage, getDetails }) => {
    // state handler for chart options
    const [chartOptions, setChartOptions] = useState(initialChartOptions);

    // load data when component loads
    useEffect(() => {
        getUsage();
        getDetails();
    }, [getUsage, getDetails]);

    useEffect(() => {
        if (!loadingUsage && !loadingDetails) {
            // create array of daily usage
            let data = [];
            let categories = [];
            const dailyUsage = usage.messages.dailyUsage;
            for (const date in dailyUsage) {
                data.push(parseInt(dailyUsage[date], 10));
                categories.push(moment(date).format('dd DD'));
            }

            // update values
            setChartOptions({
                title: {
                    text:
                        moment(Object.keys(dailyUsage)[0]).format('MMMM') +
                        ' Usage: ' +
                        numeral(usage.messages.monthlyUsage).format('0,0') +
                        ' of ' +
                        numeral(details.messageLimit).format('0,0'),
                },
                series: [{ data: data }],
                xAxis: { categories: categories },
            });
        }
    }, [loadingUsage, loadingDetails, details, usage]);

    // local state to hide/display json details
    const [displayDetails, toggleDetails] = useState(false);

    return loadingUsage || loadingDetails ? (
        <Spinner />
    ) : (
        <div>
            <h4 className='mb-3'>IEX Status</h4>
            <div className='mb-5'>
                <button type='button' className='btn btn-light' onClick={() => toggleDetails(!displayDetails)}>
                    <i className='far fa-file-alt fa-lg text-info'></i> {displayDetails ? 'Hide' : 'Show'} Details
                </button>
            </div>
            <div style={cardStyle}>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </div>

            {displayDetails && (
                <Fragment>
                    <pre>{JSON.stringify(details, null, 2)}</pre>
                    <pre>{JSON.stringify(usage, null, 2)}</pre>
                </Fragment>
            )}
        </div>
    );
};

// styles
const cardStyle = {
    // margin: '0 auto',
    marginBottom: '5rem',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    // width: '900px',
};

IEXStatus.propTypes = {
    iex: PropTypes.object.isRequired,
    getUsage: PropTypes.func.isRequired,
    getDetails: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    iex: state.iex,
});

export default connect(mapStatetoProps, { getUsage, getDetails })(IEXStatus);

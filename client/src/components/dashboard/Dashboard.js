import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import './Dashboard.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import IndexCard from './IndexCard';
import IndexGauge from './IndexGauge';
import Heatmap from './Heatmap';
import PieChart from './PieChart';
import PortfolioTable from './PortfolioTable';

// bring in actions
import { getIntraDayData } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const Dashboard = ({ auth: { isAuthenticated, loading: authLoading, user }, damwidi: { intraDay, loading }, getIntraDayData }) => {
    // state for indicies
    const [indexReturn, setIndexReturn] = useState([]);

    // load damwidi intraday data when component loads
    useEffect(() => {
        getIntraDayData();
    }, [getIntraDayData]);

    // handler for index returns
    const handleSetIndex = useCallback(
        (index, gain) => {
            setIndexReturn((prevIndexData) => {
                return { ...prevIndexData, [index]: gain };
            });
        },
        [setIndexReturn]
    );

    return (
        <div style={divStyle}>
            <h4>dashboard</h4>
            {!authLoading && isAuthenticated && (
                <div className='dashboad-wrapper'>
                    <div className='indices'>
                        <IndexGauge indexReturn={indexReturn} />
                        <IndexCard index={'DAM'} label={'damwidi'} handleSetIndex={handleSetIndex} />
                        <IndexCard index={'SPY'} label={'S&P 500'} handleSetIndex={handleSetIndex} />
                        <IndexCard index={'QQQ'} label={'NASDAQ'} handleSetIndex={handleSetIndex} />
                        <IndexCard index={'DIA'} label={'DOW 30'} handleSetIndex={handleSetIndex} />
                    </div>
                    {!loading && (
                        <>
                            <div className='charts charts-primary'>
                                <Heatmap categories={intraDay.graphHeatMap.labels} data={intraDay.graphHeatMap.datasets[0].data} title={intraDay.time} portfolio={intraDay.portfolioTable} />
                                <PieChart data={intraDay.allocationTable} />
                            </div>
                            {user !== null && user.isMember !== null && user.isMember && (
                                <div className='portfolio-table'>
                                    <PortfolioTable data={intraDay.heatMapData} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const divStyle = {
    marginTop: '4rem',
};

Dashboard.propTypes = {
    getIntraDayData: PropTypes.func.isRequired,
    damwidi: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
    auth: state.auth,
});

export default connect(mapStatetoProps, { getIntraDayData })(Dashboard);

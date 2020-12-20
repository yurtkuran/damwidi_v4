import React from 'react';
import { Route, Switch } from 'react-router-dom';

// bring in components
import Navbar from '../layout/Navbar';
import Dashboard from '../dashboard/Dashboard';

import Users from '../users/Users';
import UserForm from '../users/UserForm';
import UserLog from '../users/UserLog';

import Sectors from '../sectors/Sectors';
import SectorForm from '../sectors/SectorForm';

import Stocks from '../stocks/Stocks';
import StockForm from '../stocks/StockForm';

import SP500Components from '../etf/SP500Components';
import Etfs from '../etf/Etf';
import EtfForm from '../etf/EtfForm';
import EtfComponents from '../etf/EtfComponents';
import EtfList from '../etf/EtfList';
import StockData from '../etf/StockData';

import IEXStatus from '../info/IEXStatus';

import Unstick from '../damwidi/Unstick';
import MeetingMinutes from '../damwidi/MeetingMinutes';
import TradeHistory from '../damwidi/TradeHistory';

// bring in helpers
import PrivateRoute from '../routing/PrivateRoute';

// to-do update to private routes

const Routes = () => {
    return (
        <section className=''>
            <Navbar />
            <section className='container' style={sectionStyle}>
                <Switch>
                    <PrivateRoute exact path='/dashboard' component={Dashboard} />

                    <PrivateRoute exact path='/users' component={Users} />
                    <PrivateRoute exact path='/modifyuser' component={UserForm} />
                    <PrivateRoute exact path='/userlog' component={UserLog} />

                    <PrivateRoute exact path='/sectors' component={Sectors} />
                    <PrivateRoute exact path='/sectorform' component={SectorForm} />

                    <PrivateRoute exact path='/stocks' component={Stocks} />
                    <PrivateRoute exact path='/stockform' component={StockForm} />

                    <PrivateRoute expact path='/sp500components' component={SP500Components} />
                    <PrivateRoute expact path='/etfs' component={Etfs} />
                    <PrivateRoute exact path='/etfform' component={EtfForm} />
                    <PrivateRoute exact path='/etfcomponents' component={EtfComponents} />

                    <PrivateRoute expact path='/etflist' component={EtfList} />
                    <PrivateRoute expact path='/stockData' component={StockData} />

                    <PrivateRoute exact path='/iexstatus' component={IEXStatus} />
                    <PrivateRoute exact path='/minutes' component={MeetingMinutes} />
                    <PrivateRoute exact path='/tradehistory' component={TradeHistory} />

                    <PrivateRoute exact path='/unstick' component={Unstick} />
                </Switch>
            </section>
        </section>
    );
};

const sectionStyle = {
    marginTop: '4rem',
};

export default Routes;

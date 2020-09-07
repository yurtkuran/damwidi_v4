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

import IEXStatus from '../info/IEXStatus';

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

                    <Route exact path='/sectors' component={Sectors} />
                    <Route exact path='/sectorform' component={SectorForm} />

                    <Route exact path='/stocks' component={Stocks} />
                    <Route exact path='/stockform' component={StockForm} />

                    <PrivateRoute exact path='/iexstatus' component={IEXStatus} />
                </Switch>
            </section>
        </section>
    );
};

const sectionStyle = {
    marginTop: '4rem',
};

export default Routes;

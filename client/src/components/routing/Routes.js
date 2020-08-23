import React from 'react';
import { Route, Switch } from 'react-router-dom';

// bring in components
import Navbar from '../layout/Navbar';
import Dashboard from '../dashboard/Dashboard';

import Users from '../users/Users';
import UserForm from '../users/UserForm';
import UserLog from '../users/UserLog';

import Sectors from '../sectors/Sectors';

import Stocks from '../stocks/Stocks';
import StockForm from '../stocks/StockForm';

// bring in helpers
import PrivateRoute from '../routing/PrivateRoute';

const Routes = () => {
    return (
        <section className=''>
            <Navbar />
            <section className='container my-4'>
                <Switch>
                    <PrivateRoute exact path='/dashboard' component={Dashboard} />

                    <PrivateRoute exact path='/users' component={Users} />
                    <PrivateRoute exact path='/modifyuser' component={UserForm} />
                    <PrivateRoute exact path='/userlog' component={UserLog} />

                    <Route exact path='/sectors' component={Sectors} />

                    <Route exact path='/stocks' component={Stocks} />
                    <Route exact path='/stockform' component={StockForm} />
                </Switch>
            </section>
        </section>
    );
};

export default Routes;

import React from 'react';
import { Route, Switch } from 'react-router-dom';

// bring in components
import Navbar from '../layout/Navbar';
import Dashboard from '../dashboard/Dashboard';

// bring in helpers
import PrivateRoute from '../routing/PrivateRoute';

const Routes = () => {
    return (
        <section className=''>
            <Navbar />
            <Switch>
                <PrivateRoute exact path='/dashboard' component={Dashboard} />
            </Switch>
        </section>
    );
};

export default Routes;

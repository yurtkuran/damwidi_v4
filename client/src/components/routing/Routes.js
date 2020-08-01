import React from 'react';
import { Route, Switch } from 'react-router-dom';

// bring in components
import Navbar from '../layout/Navbar';
import Dashboard from '../dashboard/Dashboard';
import Users from '../users/Users';
import UserForm from '../users/UserForm';

// bring in helpers
import PrivateRoute from '../routing/PrivateRoute';

const Routes = () => {
    return (
        <section className=''>
            <Navbar />
            <section className='container my-4'>
                <Switch>
                    <Route exact path='/dashboard' component={Dashboard} />

                    <PrivateRoute exact path='/users' component={Users} />
                    <Route exact path='/modifyuser' component={UserForm} />
                </Switch>
            </section>
        </section>
    );
};

export default Routes;

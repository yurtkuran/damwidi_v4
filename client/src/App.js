import React, { Fragment, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

// bring in components
import Landing from './components/layout/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Confirm from './components/auth/Confirm';
import Routes from './components/routing/Routes';

// bring in redux
import { Provider } from 'react-redux';
import store from './store';

// bring in actions
import { loadUser } from './actions/authActions';
import { login } from './actions/authActions'; // REMOVE BEFORE DEPLOYMENT to-do

// bring in functions
import setAuthToken from './utils/setAuthToken';

// css files
import './css/colors.css';
import './css/style.css';

// if a token exists in local storage, add to global header
if (localStorage.token) {
    setAuthToken(localStorage.token);
}

const App = () => {
    useEffect(() => {
        // login admin user - REMOVE BEFORE DEPLOYMENT to-do
        const email = 'marge@springfield.com';
        const password = '111111';
        store.dispatch(login({ email, password }));
        setAuthToken(localStorage.token);

        store.dispatch(loadUser());
    }, []);

    return (
        <Provider store={store}>
            <Router>
                <Fragment>
                    <Switch>
                        <Route exact path='/' component={Landing} />
                        <Route exact path='/login' component={Login} />
                        <Route exact path='/register' component={Register} />
                        <Route exact path='/confirm/:token' component={Confirm} />

                        <Route component={Routes} />
                    </Switch>
                </Fragment>
            </Router>
        </Provider>
    );
};

export default App;

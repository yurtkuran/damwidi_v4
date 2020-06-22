import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

const PrivateRoute = ({ component: Component, auth: { isAuthenticated, loading }, ...rest }) => (
    <Route {...rest} render={(props) => (!isAuthenticated && !loading ? <Redirect to='/login' /> : <Component {...props} />)} />
);

PrivateRoute.propTypes = {
    auth: PropTypes.object.isRequired,
};

const mapSatetoProps = (state) => ({
    auth: state.auth,
});

export default connect(mapSatetoProps)(PrivateRoute);

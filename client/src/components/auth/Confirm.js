import React, { Fragment, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { confirmToken } from '../../actions/authActions';

const Confirm = ({ match, isAuthenticated, confirmToken }) => {
    // confirm JWT token when component loads
    useEffect(() => {
        confirmToken(match.params.token);
    }, [confirmToken, match.params.token]);

    // redirect
    if (isAuthenticated) {
        return <Redirect to='/dashboard' />;
    } else {
        return <Redirect to='/login' />;
    }
};

Confirm.propTypes = {
    confirmToken: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
};

const mapStatetoProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStatetoProps, { confirmToken })(Confirm);

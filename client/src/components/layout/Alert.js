import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';

// bring in bootstrap components
import Alert from 'react-bootstrap/Alert';

// bring in redux
import { connect } from 'react-redux';

const DisplayAlert = ({ alerts }) => {
    return (
        alerts !== null &&
        alerts.length > 0 &&
        alerts.map((alert) => (
            <Alert variant={alert.alertType} dismissible={false} show={true} className='py-1 px-3'>
                <i className='fas fa-info mr-2' /> {alert.msg}
            </Alert>
        ))
    );
};

DisplayAlert.propTypes = {
    alerts: PropTypes.array.isRequired,
};

const mapStatetoProps = (state) => ({
    alerts: state.alert,
});

export default connect(mapStatetoProps, null)(DisplayAlert);

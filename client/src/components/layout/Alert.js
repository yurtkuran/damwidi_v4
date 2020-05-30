import React from 'react';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

const Alert = ({ alerts }) =>
    alerts !== null &&
    alerts.length > 0 &&
    alerts.map((alert) => (
        <div key={alert.id} className={`alert alert-${alert.alertType}`}>
            <i className='fas fa-info-cirle' /> {alert.msg}
        </div>
    ));

Alert.propTypes = {
    alerts: PropTypes.array.isRequired,
};

const mapStatetoProps = (state) => ({
    alerts: state.alert,
});

export default connect(mapStatetoProps, null)(Alert);

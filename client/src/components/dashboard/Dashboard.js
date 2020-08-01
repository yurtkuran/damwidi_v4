import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions

const Dashboard = () => {
    return (
        <div>
            <h1>dashboard</h1>
        </div>
    );
};

Dashboard.propTypes = {};

export default connect(null)(Dashboard);

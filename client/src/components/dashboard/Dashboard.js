import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions

const Dashboard = () => {
    return (
        <div style={divStyle}>
            <h1>dashboard</h1>
        </div>
    );
};

const divStyle = {
    marginTop: '4rem',
};

Dashboard.propTypes = {};

export default connect(null)(Dashboard);

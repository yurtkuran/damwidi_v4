import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import AllocationTable from './AllocationTable';

// bring in actions
import { getAllocation, getOpenPositionsDetail } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const Allocation = ({ allocation, loading, openPositions, openPositionsLoading, getAllocation, getOpenPositionsDetail }) => {
    // load damwidi data
    useEffect(() => {
        getAllocation();
        getOpenPositionsDetail();
    }, [getAllocation, getOpenPositionsDetail]);

    return (
        <div>
            <h4>allocation</h4>
            {!loading && !openPositionsLoading && <AllocationTable data={allocation} performanceData={openPositions} />}
        </div>
    );
};

Allocation.propTypes = {
    getAllocation: PropTypes.func.isRequired,
    getOpenPositionsDetail: PropTypes.func.isRequired,
    allocation: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    openPositionsLoading: PropTypes.bool.isRequired,
};

const mapStatetoProps = (state) => ({
    allocation: state.damwidi.allocation,
    loading: state.damwidi.loading,
    openPositions: state.damwidi.openPositionsDetail,
    openPositionsLoading: state.damwidi.openPositionsDetailLoading,
});

export default connect(mapStatetoProps, { getAllocation, getOpenPositionsDetail })(Allocation);

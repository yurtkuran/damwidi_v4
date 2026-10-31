import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import AllocationTable from './AllocationTable';

// bring in actions
import { getAllocationData } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const Allocation = ({ damwidi: { allocationData, allocationError, allocationLoading }, getAllocationData }) => {
    // load damwidi data
    useEffect(() => {
        getAllocationData();
    }, [getAllocationData]);

    return (
        <div>
            <h4>allocation</h4>
            {!allocationLoading && allocationData && (
                <AllocationTable data={allocationData.rows} fund={allocationData.fund} />
            )}
            {!allocationLoading && allocationError && <p>unable to load allocation data</p>}
        </div>
    );
};

Allocation.propTypes = {
    damwidi: PropTypes.shape({
        allocationData: PropTypes.object,
        allocationError: PropTypes.bool.isRequired,
        allocationLoading: PropTypes.bool.isRequired,
    }).isRequired,
    getAllocationData: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getAllocationData })(Allocation);

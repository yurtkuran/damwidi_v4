import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import AllocationTable from './AllocationTable';

// bring in actions
import { getIntraDayData } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

const Allocation = ({ damwidi: { intraDay, loading }, getIntraDayData }) => {
    // load damwidi data
    useEffect(() => {
        getIntraDayData();
    }, [getIntraDayData]);

    return (
        <div>
            <h4>allocation</h4>
            {!loading && (
                <>
                    <AllocationTable data={intraDay.allocationTable} performanceData={intraDay.performanceData.data} />
                </>
            )}
        </div>
    );
};

Allocation.propTypes = {
    getIntraDayData: PropTypes.func.isRequired,
    intraDay: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getIntraDayData })(Allocation);

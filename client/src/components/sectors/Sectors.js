import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in components
import Spinner from '../layout/Spinner';
import SectorItem from './SectorItem';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getSectors, clearCurrent } from '../../actions/sectorActions';

const Sectors = ({ sector: { sectors, loading }, getSectors, clearCurrent }) => {
    // load stocks when component loads, clear current stock
    useEffect(() => {
        getSectors();
        clearCurrent();
    }, [getSectors, clearCurrent]);

    return loading ? (
        <Spinner />
    ) : (
        <div className='col-sm-10 m-auto'>
            <h4 className=''>
                <i class='fas fa-plus mr-3' />
                Sectors
            </h4>
            <table className='table table-bordered table-striped'>
                <thead>
                    <tr>
                        <th className='text-center'>Symbol</th>
                        <th className='text-left'>Name</th>
                        <th className='text-left'>Description</th>
                        <th className='text-Right'>Weight</th>
                        <th className='text-center' colSpan='2'>
                            Controls
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sectors
                        .filter((sector) => sector.type === 'S')
                        .map((sector) => (
                            <SectorItem sector={sector} />
                        ))}
                </tbody>
            </table>
        </div>
    );
};

Sectors.prototypes = {
    getSectors: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
    sector: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    sector: state.sector,
});

export default connect(mapStatetoProps, { getSectors, clearCurrent })(Sectors);

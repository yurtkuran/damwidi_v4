import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/sectorActions';

const SectorItem = ({ sector, setCurrent }) => {
    // destructure stock object
    const { symbol, name, description, weight } = sector;

    return (
        <tr>
            <td className='text-center'>{symbol}</td>
            <td className='text-left'>{name} </td>
            <td className='text-left'>{description} </td>
            <td className='text-right'>{weight} </td>

            <td className='text-center text-primary'>
                <Link to='#' onClick={() => setCurrent(sector)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <i className='far fa-trash-alt'></i>
            </td>
        </tr>
    );
};

SectorItem.prototypes = {
    setCurrent: PropTypes.func.isRequired,
    sector: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(SectorItem);

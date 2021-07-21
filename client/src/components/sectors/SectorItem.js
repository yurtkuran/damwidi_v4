import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ContentEditable from 'react-contenteditable';

// bring in components

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/sectorActions';

const SectorItem = ({ sector, weight, setCurrent, setShow, setMessage, updateWeight, blurWeight, weightStyle }) => {
    // destructure stock object
    const { symbol, name, description } = sector;

    const handleDelete = (id) => {
        setCurrent(sector);
        setMessage(`Are you sure you want to delete ${symbol}?`);
        setShow(true);
    };

    return (
        <tr>
            <td className='text-center'>{symbol}</td>
            <td className='text-left'>{name} </td>
            <td className='text-left'>{description}</td>
            <td className='text-right'>
                <ContentEditable
                    html={weight}
                    style={weightStyle}
                    className='weightInput'
                    onChange={(e) => updateWeight(symbol, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    onBlur={() => blurWeight(sector.id, symbol)}
                />
            </td>

            <td className='text-center text-primary'>
                <Link to='/sectorform' className='noOutlineOnFocus' onClick={() => setCurrent(sector)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <Link to='#' className='noOutlineOnFocus' onClick={() => handleDelete(sector.id)}>
                    <i className='far fa-trash-alt'></i>
                </Link>
            </td>
        </tr>
    );
};

SectorItem.prototypes = {
    setCurrent: PropTypes.func.isRequired,
    sector: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(SectorItem);

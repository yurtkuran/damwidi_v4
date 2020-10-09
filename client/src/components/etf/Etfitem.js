import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/etfActions';

const EtfItem = ({ etf, setCurrent, setShow, setMessage }) => {
    // destructure stock object
    const { _id, symbol, description } = etf;

    const handleDelete = (id) => {
        setCurrent(etf);
        setMessage(`Are you sure you want to delete the EFT ${symbol}?`);
        setShow(true);
    };

    return (
        <tr key={_id}>
            <td className='text-center'>{symbol} </td>
            <td className='text-left'>{description}</td>
            <td className='text-center text-primary'>
                <Link to='/etfform' onClick={() => setCurrent(etf)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <Link to='/etfcomponents' onClick={() => setCurrent(etf)}>
                    <i className='fas fa-list-ol'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <Link to='#' onClick={() => handleDelete(_id)}>
                    <i className='far fa-trash-alt'></i>
                </Link>
            </td>
        </tr>
    );
};

EtfItem.prototypes = {
    setCurrent: PropTypes.func.isRequired,
    etf: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(EtfItem);

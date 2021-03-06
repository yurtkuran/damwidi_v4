import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/stockActions';

const StockItem = ({ stock, setCurrent, setShow, setMessage }) => {
    // destructure stock object
    const { id, sector, symbol, companyName } = stock;

    const handleDelete = (id) => {
        setCurrent(stock);
        setMessage(`Are you sure you want to delete ${symbol}?`);
        setShow(true);
    };

    return (
        <tr key={id}>
            <td className='text-center'>{symbol} </td>
            <td className='text-center'>{sector}</td>
            <td>{companyName}</td>
            <td className='text-center text-primary'>
                <Link to='/stockform' onClick={() => setCurrent(stock)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <Link to='#' onClick={() => handleDelete(id)}>
                    <i className='far fa-trash-alt'></i>
                </Link>
            </td>
        </tr>
    );
};

StockItem.prototypes = {
    setCurrent: PropTypes.func.isRequired,
    stock: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(StockItem);

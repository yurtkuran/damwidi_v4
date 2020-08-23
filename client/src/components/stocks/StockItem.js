import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/stockActions';

const StockItem = ({ stock, setCurrent }) => {
    // destructure stock object
    const { sector, symbol, companyName } = stock;

    return (
        <tr>
            <td className='text-center'>{sector}</td>
            <td className='text-center'>{symbol} </td>
            <td>{companyName}</td>
            <td className='text-center text-primary'>
                <Link to='/stockform' onClick={() => setCurrent(stock)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <i className='far fa-trash-alt'></i>
            </td>
        </tr>
    );
};

StockItem.prototypes = {
    setCurrent: PropTypes.func.isRequired,
    stock: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(StockItem);

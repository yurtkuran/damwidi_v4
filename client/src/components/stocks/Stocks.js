import React, { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';
import ModalConfirm from '../layout/ModalConfirm';
import StockItem from './StockItem';

// bring in actions
import { getStocks, deleteStock, clearCurrent } from '../../actions/stockActions';

const Stocks = ({ stock: { stocks, loading, current }, getStocks, deleteStock, clearCurrent }) => {
    // load stocks when component loads, clear current stock
    useEffect(() => {
        getStocks();
        clearCurrent();
    }, [getStocks, clearCurrent]);

    // modal props
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    // hande delete confirmation
    const handleClose = (action = '') => {
        setShow(false);
        if (action === 'delete') deleteStock(current.id);
        clearCurrent();
    };

    return loading ? (
        <Spinner />
    ) : (
        <Fragment>
            <ModalConfirm show={show} setShow={setShow} handleClose={handleClose} message={message} title={'Confirm Deletion'} />
            <div className='col-sm-10 m-auto'>
                <h4 className=''>
                    <Link to='/stockform'>
                        <i className='fas fa-plus mr-3'></i>
                    </Link>
                    Stocks
                </h4>
                <table className='table table-bordered table-striped'>
                    <thead>
                        <tr>
                            <th className='text-center'>Stock</th>
                            <th className='text-center'>Sector</th>
                            <th>Company Name</th>
                            <th className='text-center' colSpan='2'>
                                Controls
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks
                            .sort((a, b) => {
                                return a['symbol'] < b['symbol'] ? -1 : a['symbol'] > b['symbol'] ? 1 : 0;
                            })
                            .map((stock) => (
                                <StockItem key={stock.id} stock={stock} setShow={setShow} setMessage={setMessage} />
                            ))}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};

Stocks.prototypes = {
    getStocks: PropTypes.func.isRequired,
    deleteStock: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
    stock: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    stock: state.stock,
});

export default connect(mapStatetoProps, { getStocks, deleteStock, clearCurrent })(Stocks);

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in components
import Spinner from '../layout/Spinner';
import StockItem from './StockItem';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getStocks, clearCurrent } from '../../actions/stockActions';

const Stocks = ({ stock: { stocks, loading }, getStocks, clearCurrent }) => {
    // load stocks when component loads, clear current stock
    useEffect(() => {
        getStocks();
        clearCurrent();
    }, [getStocks, clearCurrent]);

    return loading ? (
        <Spinner />
    ) : (
        <div className='col-sm-10 m-auto'>
            <h4 className=''>
                <i class='fas fa-plus mr-3' />
                Stocks
            </h4>
            <table className='table table-bordered table-striped'>
                <thead>
                    <tr>
                        <th className='text-center'>Sector</th>
                        <th className='text-center'>Stock</th>
                        <th>Company Name</th>
                        <th className='text-center' colSpan='2'>
                            Controls
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map((stock) => (
                        <StockItem stock={stock} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

Stocks.prototypes = {
    getStocks: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
    stock: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    stock: state.stock,
});

export default connect(mapStatetoProps, { getStocks, clearCurrent })(Stocks);

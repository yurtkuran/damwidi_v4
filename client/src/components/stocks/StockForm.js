import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions

const StockForm = ({ current }) => {
    return (
        <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
            <h4>Update Stock</h4>
            <div className='card card-body border-secondary card-shadow'>
                <form>
                    <div className='form-group row'>
                        <div className='col-sm-6'>
                            <label for='inputSectorETF'>Sector Symbol</label>
                            {/* <select className="form-control" id="inputSectorETF" name="sector">
                            <option selected>Select ETF</option>
                            {{#each sectors}}
                                <option value="{{symbol}}" {{{iffselected symbol ../stock.sector}}}>{{symbol}} : {{name}} </option>
                            {{/each}}
                        </select> */}
                            <h6 className='small text-danger'>stock error</h6>
                        </div>
                        <div className='col-sm-6'>
                            <label for='inputStockSymbol'>Stock Symbol</label>
                            <input type='text' id='inputStockSymbol' name='symbol' className='form-control' placeholder='Enter Symbol' value='{{stock.symbol}}' />
                            <h6 className='small text-danger'>symbol error</h6>
                        </div>
                    </div>
                    <div className='row justify-content-end'>
                        <Link to='/stocks' className='btn btn-secondary m-3 rounded'>
                            <i className='fa fa-list-alt mr-2'></i>View All
                        </Link>
                        <button type='submit' className='btn btn-primary m-3 rounded'>
                            <i className='fa fa-database mr-2'></i>Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

StockForm.propTypes = {
    current: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.stock.current,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, null)(StockForm);

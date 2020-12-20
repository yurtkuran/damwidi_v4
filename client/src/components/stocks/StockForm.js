import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions
import { getSectors } from '../../actions/sectorActions';
import { validateSymbol as validateSymbolIEX } from '../../actions/iexActions';
import { validateSymbol as validateStock, addOrUpdateStock } from '../../actions/stockActions';

// set initial form state
const initialFormState = {
    sector: '',
    symbol: '',
};

// set initial error state
const initialErrorState = {
    sector: '',
    symbol: '',
};

const StockForm = ({ current, sector: { sectors, loading }, getSectors, validateStock, addOrUpdateStock, history }) => {
    // init local form data
    const [formData, setFormData] = useState(initialFormState);

    // init form error messages
    const [errorMessage, setErrorMessage] = useState(initialErrorState);

    // load sectors for select input
    // setup formdata
    useEffect(() => {
        getSectors();

        if (current === null) {
            // current object is null: add new sector
            setFormData(initialFormState);
        } else {
            // current object exists: edit existign sector
            setFormData(current);
        }
    }, [getSectors, setFormData, current]);

    // destructure form fields
    const { sector, symbol } = formData;

    // validate fields
    const validateFields = async (field) => {
        let error = '';
        switch (field) {
            case 'sector':
                error = sector === '' ? 'Sector is required' : '';
                break;

            case 'symbol':
                if (symbol === '') {
                    error = 'Symbol is required';
                } else {
                    // make uppercase
                    setFormData((prevFormData) => {
                        return { ...prevFormData, symbol: symbol.toUpperCase() };
                    });

                    // check if valid symbol an update company name
                    const companyData = await validateSymbolIEX({ symbol });
                    if (companyData) {
                        setFormData((prevFormData) => {
                            return { ...prevFormData, companyName: companyData.companyName };
                        });
                    } else {
                        error = 'Invalid symbol';
                    }

                    // verify symbol (check if symbol is in use)
                    if (error === '' && (current === null || symbol.toUpperCase() !== current.symbol)) {
                        error = !(await validateStock({ symbol })) ? 'Stock already in use' : '';
                    }
                }
                break;

            default:
                break;
        }
        setErrorMessage((prevErrorMessage) => {
            return { ...prevErrorMessage, [field]: error };
        });
        return error.length === 0 ? true : false;
    };

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();

        // validate form before submitting
        var isFormValid = true;
        for (const field of Object.keys(errorMessage)) {
            isFormValid = await validateFields(field);
        }

        if (isFormValid) {
            addOrUpdateStock(formData, history);
        }
    };

    return loading ? (
        <Spinner />
    ) : (
        <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
            <h4 className='text-center'>{current === null ? 'Add Stock' : 'Edit Stock'}</h4>
            <div className='card card-body border-secondary card-shadow'>
                <form onSubmit={onSubmit}>
                    <div className='form-group row'>
                        <div className='col-sm-6'>
                            <label htmlFor='inputSectorETF' className='mb-0'>
                                Sector Symbol
                            </label>
                            <select className='form-control' value={sector} name='sector' onChange={onChange} onBlur={async (e) => await validateFields(e.target.name)}>
                                <option value=''>Select ETF</option>
                                {sectors
                                    .filter((sector) => sector.type === 'S')
                                    .sort((a, b) => {
                                        return a['name'] < b['name'] ? -1 : a['name'] > b['name'] ? 1 : 0;
                                    })
                                    .map((sector) => (
                                        <option key={sector.id} value={sector.symbol}>{`${sector.symbol} : ${sector.name}`}</option>
                                    ))}
                            </select>
                            <h6 className='small text-danger'>{errorMessage.sector !== '' && errorMessage.sector}</h6>
                        </div>
                        <div className='col-sm-6'>
                            <label htmlFor='inputStockSymbol' className='mb-0'>
                                Stock Symbol
                            </label>
                            <input
                                type='text'
                                id='inputStockSymbol'
                                name='symbol'
                                className='form-control'
                                placeholder='Enter Symbol'
                                value={symbol}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.name)}
                            />
                            <h6 className='small text-danger'>{errorMessage.symbol !== '' && errorMessage.symbol}</h6>
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
    getSectors: PropTypes.func.isRequired,
    validateStock: PropTypes.func.isRequired,
    addOrUpdateStock: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.stock.current,
    sector: state.sector,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, { getSectors, validateStock, addOrUpdateStock })(StockForm);

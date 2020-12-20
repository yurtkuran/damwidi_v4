import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { validateSymbol } from '../../actions/iexActions';
import { addOrUpdateETF, validateSymbol as validateETF } from '../../actions/etfActions';

// set initial form state
const initialState = {
    symbol: '',
    description: '',
    weightType: 'market',
    disabled: false,
};

// set initial error state
const initialErrorState = {
    symbol: '',
    description: '',
};

const EtfForm = ({ current, addOrUpdateETF, history }) => {
    // init local form data
    const [formData, setFormData] = useState(initialState);

    // init form error messages
    const [errorMessage, setErrorMessage] = useState(initialErrorState);

    // load profife when component loads
    useEffect(() => {
        if (current === null) {
            // current object is null: add new sector
            setFormData(initialState);
        } else {
            // current object exists: edit existign sector
            setFormData(current);
        }
    }, [setFormData, current]);

    // destructure form fields
    const { symbol, description, weightType, disabled } = formData;

    // validate fields
    const validateFields = async (field) => {
        let error = '';
        switch (field) {
            case 'description':
                error = description === '' ? 'ETF description is required' : '';
                break;

            case 'symbol':
                if (symbol === '') {
                    error = 'ETF symbol is required';
                } else {
                    setFormData((prevFormData) => {
                        return { ...prevFormData, symbol: symbol.toUpperCase() };
                    });

                    if (error === '' && (current === null || symbol.toUpperCase() !== current.symbol)) {
                        error = !(await validateETF({ symbol })) ? 'Symbol already in use' : '';
                    }

                    if (error === '') {
                        const companyData = await validateSymbol({ symbol });
                        if (companyData) {
                            setFormData((prevFormData) => {
                                return { ...prevFormData, description: companyData.companyName, disabled: true };
                            });
                        } else {
                            setFormData((prevFormData) => {
                                return { ...prevFormData, disabled: false };
                            });
                        }
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

    // on submit handler
    const onSubmit = async (e) => {
        e.preventDefault();

        // validate form before submitting
        var isFormValid = true;
        let validField = true;
        for (const field of Object.keys(errorMessage)) {
            validField = await validateFields(field);
            isFormValid = isFormValid && validField;
        }
        if (isFormValid) {
            addOrUpdateETF(formData, history);
        }
    };

    return (
        <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
            <h4 className='text-center'>{current === null ? 'Add ETF' : 'Edit ETF'}</h4>
            <div className='card card-body border-secondary card-shadow'>
                <form onSubmit={onSubmit}>
                    <div className='form-group row'>
                        <div className='col-sm-6 col'>
                            <label htmlFor='inputSectorSymbol' className='mb-0'>
                                Symbol
                            </label>
                            <input
                                type='text'
                                id='inputSectorSymbol'
                                name='symbol'
                                className='form-control'
                                placeholder='Enter Symbol'
                                value={symbol}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.name)}
                            />
                            <h6 className='small text-danger'>{errorMessage.symbol !== '' && errorMessage.symbol}</h6>
                        </div>
                        <div className='col'>
                            Weight Type
                            <div className='form-check'>
                                <input className='form-check-input' type='radio' name='weightType' id='radio_01' value='market' onChange={onChange} checked={weightType === 'market'} />
                                <label className='form-check-label' htmlFor='radio_01'>
                                    Market Weight
                                </label>
                            </div>
                            <div className='form-check'>
                                <input className='form-check-input' type='radio' name='weightType' id='radio_02' value='manual' onChange={onChange} checked={weightType === 'manual'} />
                                <label className='form-check-label' htmlFor='radio_02'>
                                    Manual
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className='form-group row'>
                        <div className='col-sm-12'>
                            <label htmlFor='inputSectorDesc' className='mb-0'>
                                Description
                            </label>
                            <input
                                type='text'
                                id='inputSectorDesc'
                                name='description'
                                className='form-control'
                                placeholder='Enter Sector Description'
                                value={description}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.description)}
                                disabled={disabled}
                            />
                            <h6 className='small text-danger'>{errorMessage.description !== '' && errorMessage.description}</h6>
                        </div>
                    </div>

                    <div className='row justify-content-end'>
                        <Link to='/etfs' className='btn btn-secondary m-3 rounded'>
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

EtfForm.propTypes = {
    current: PropTypes.object.isRequired,
    addOrUpdateETF: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.etf.current,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, { addOrUpdateETF })(EtfForm);

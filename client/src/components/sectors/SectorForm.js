import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { validateSymbol as validateSymbolIEX } from '../../actions/iexActions';
import { validateSymbol as validateSector, addOrUpdateSector } from '../../actions/sectorActions';

// set initial form state
const initialState = {
    symbol: '',
    name: '',
};

// set initial error state
const initialErrorState = {
    symbol: '',
    name: '',
};

const SectorForm = ({ current, validateSector, addOrUpdateSector, history }) => {
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
    const { symbol, name } = formData;

    // validate fields
    const validateFields = async (field) => {
        let error = '';
        switch (field) {
            case 'name':
                error = name === '' ? 'Sector name is required' : '';
                break;

            case 'symbol':
                if (symbol === '') {
                    error = 'Symbol is required';
                } else {
                    // check if valid symbol and update description
                    const companyData = await validateSymbolIEX({ symbol });
                    if (companyData) {
                        setFormData({ ...formData, description: companyData.companyName });
                    } else {
                        error = 'Invalid symbol';
                    }

                    // verify symbol (check if symbol is in use)
                    if (error === '' && symbol.toUpperCase() !== current.symbol) {
                        error = !(await validateSector({ symbol })) ? 'Sector already in use' : '';
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
        for (const field of Object.keys(errorMessage)) {
            isFormValid = await validateFields(field);
        }

        if (isFormValid) {
            addOrUpdateSector(formData, history);
        }
    };

    return (
        <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
            <h4 className='text-center'>{current === null ? 'Add Sector' : 'Edit Sector'}</h4>
            <div className='card card-body border-secondary card-shadow'>
                <form onSubmit={onSubmit}>
                    <div className='form-group row'>
                        <div className='col-sm-6'>
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
                    </div>

                    <div className='form-group row'>
                        <div className='col-sm-12'>
                            <label htmlFor='inputSectorName' className='mb-0'>
                                Name
                            </label>
                            <input
                                type='text'
                                id='inputSectorName'
                                name='name'
                                className='form-control'
                                placeholder='Sector Name'
                                value={name}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.name)}
                            />
                            <h6 className='small text-danger'>{errorMessage.name !== '' && errorMessage.name}</h6>
                        </div>
                    </div>

                    <div className='row justify-content-end'>
                        <Link to='/sectors' className='btn btn-secondary m-3 rounded'>
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

SectorForm.propTypes = {
    current: PropTypes.object.isRequired,
    validateSector: PropTypes.func.isRequired,
    addOrUpdateSector: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.sector.current,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, { validateSector, addOrUpdateSector })(SectorForm);

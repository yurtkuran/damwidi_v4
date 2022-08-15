import React, { useState, useEffect } from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import validator from 'email-validator';

// bring in components

// bring in bootstrap components
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { register } from '../../actions/authActions';
import { clearMessages } from '../../actions/messageActions';

// bring in functions
import { isFormValid } from '../../utils/isFormValid';

// bring in password validator schema
import validatePassword from '../../utils/validatePassword';

// bring in dependencies
import './auth.scss';

const initialErrorState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password2: '',
};

const Register = ({ register, clearMessages, history, errorMessages, auth: { loading, isAuthenticated } }) => {
    // init form error messages
    const [errorMessage, setErrorMessage] = useState(initialErrorState);

    // local form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        password2: '',
    });

    // destructure
    const { firstName, lastName, email, password, password2 } = formData;

    // handle server-side error messages
    useEffect(() => {
        if (errorMessages) {
            errorMessages.forEach((error) => {
                setErrorMessage({ ...errorMessages, [error.field]: error.msg });
                clearMessages(error.field);
            });
        }
    }, [clearMessages, setErrorMessage, errorMessages]);

    // validate fields
    const validateFields = async (field) => {
        let error = '';
        switch (field) {
            case 'firstName':
                error = firstName === '' ? 'First name is required' : '';
                break;
            case 'lastName':
                error = lastName === '' ? 'Last name is required' : '';
                break;
            case 'email':
                error = !validator.validate(email) ? 'Invald email' : '';
                break;
            case 'password':
                error = !validatePassword(password) ? 'Password does not meet criteria' : '';
                break;
            case 'password2':
                error = password !== password2 && validatePassword(password) ? 'Passwords do not match' : '';
                break;
            default:
                break;
        }
        setErrorMessage({ ...errorMessage, [field]: error });
        return error;
    };

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();

        // validate form before submitting
        var formErrors = {};
        const fields = Object.keys(errorMessage);
        for (const field of fields) {
            formErrors[field] = await validateFields(field);
        }
        setErrorMessage(formErrors);

        if (isFormValid(formErrors)) {
            register({
                firstName,
                lastName,
                email,
                password,
                history,
            });
        } else {
            console.log('invalid form');
        }
    };

    // redirect if logged in
    if (isAuthenticated) {
        return <Redirect to='/dashboard' />;
    }

    // define popover
    const popover = (
        <Popover id='popover-basic'>
            <Popover.Title as='h3' className='text-center'>
                Password Criteria{' '}
            </Popover.Title>
            <Popover.Content>
                <p className='my-0'>8 to 24 characters and must include:</p>
                <p className='my-0'>
                    <i className='fas fa-caret-right mr-1' /> UPPER case letters
                </p>
                <p className='my-0'>
                    <i className='fas fa-caret-right mr-1' /> lower case letters
                </p>
                <p className='my-0'>
                    <i className='fas fa-caret-right mr-1' /> at least one number
                </p>
                <p className='my-0'>
                    <i className='fas fa-caret-right mr-1' /> at least one symbol
                </p>
            </Popover.Content>
        </Popover>
    );

    return (
        <section className='landing'>
            <div className='dark-overlay'>
                <div className='header'>
                    <nav>
                        <ul>
                            <li>
                                <Link to='/'>DAMWIDI Investments</Link>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div className='landing-inner-form'>
                    <div className='landing-form'>
                        <div className='card card-body border-dark card-shadow'>
                            <h1 className='text-center mb-3'>
                                <i className='fas fa-user-plus'></i> Register
                            </h1>

                            <form onSubmit={onSubmit}>
                                <div className='form-group row'>
                                    <div className='col-sm-6'>
                                        <label className='mb-0' htmlFor='inputFirstname'>
                                            First Name
                                        </label>
                                        <input
                                            type='text'
                                            id='inputFirstname'
                                            name='firstName'
                                            className='form-control form-control-sm'
                                            placeholder='Enter First Name'
                                            value={firstName}
                                            onChange={onChange}
                                            onBlur={async (e) => await validateFields(e.target.name)}
                                        />
                                        <h6 className='small text-danger'>{errorMessage.firstName !== '' && errorMessage.firstName}</h6>
                                    </div>
                                    <div className='col-sm-6'>
                                        <label className='mb-0' htmlFor='inputLastname'>
                                            Last Name
                                        </label>
                                        <input
                                            type='text'
                                            id='inputLastname'
                                            name='lastName'
                                            className='form-control form-control-sm'
                                            placeholder='Enter Last Name'
                                            value={lastName}
                                            onChange={onChange}
                                            onBlur={async (e) => await validateFields(e.target.name)}
                                        />
                                        <h6 className='small text-danger'>{errorMessage.lastName !== '' && errorMessage.lastName}</h6>
                                    </div>
                                </div>

                                <div className='form-group row'>
                                    <div className='col-sm-12'>
                                        <label className='mb-0 mt-0' htmlFor='inputEmail'>
                                            Email
                                        </label>
                                        <input
                                            type='text'
                                            id='inputEmail'
                                            name='email'
                                            className='form-control form-control-sm'
                                            placeholder='Enter Email'
                                            autoComplete='username'
                                            value={email}
                                            onChange={onChange}
                                            onBlur={async (e) => await validateFields(e.target.name)}
                                        />
                                        <h6 className='small text-danger'>{errorMessage.email !== '' && errorMessage.email}</h6>
                                    </div>
                                </div>

                                <div className='form-group row'>
                                    <div className='col-sm-12'>
                                        <label className='mb-0' htmlFor='inputPassword'>
                                            <div className='text-left'>
                                                <OverlayTrigger placement='right' overlay={popover}>
                                                    <i className='fas fa-info-circle mr-2' />
                                                </OverlayTrigger>
                                                Password
                                            </div>
                                        </label>
                                        <input
                                            type='password'
                                            id='inputPassword'
                                            name='password'
                                            className='form-control form-control-sm'
                                            placeholder='Create Password'
                                            autoComplete='new-password'
                                            value={password}
                                            onChange={onChange}
                                            onBlur={async (e) => await validateFields(e.target.name)}
                                        />
                                        <h6 className='small text-danger'>{errorMessage.password !== '' && errorMessage.password}</h6>
                                    </div>
                                </div>

                                <div className='form-group row'>
                                    <div className='col-sm-12'>
                                        <label className='mb-0' htmlFor='inputPassword2'>
                                            Confirm Password
                                        </label>
                                        <input
                                            type='password'
                                            id='inputPassword2'
                                            name='password2'
                                            className='form-control form-control-sm'
                                            placeholder='Confirm Password'
                                            autoComplete='new-password'
                                            value={password2}
                                            onChange={onChange}
                                            onBlur={async (e) => await validateFields(e.target.name)}
                                        />
                                        <h6 className='small text-danger'>{errorMessage.password2 !== '' && errorMessage.password2}</h6>
                                    </div>
                                </div>

                                <button type='submit' className='btn btn-primary btn-block'>
                                    Register
                                </button>
                            </form>
                            <p className='lead mt-4'>
                                Already have an account? <Link to='/login'>Login</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

Register.propTypes = {
    register: PropTypes.func.isRequired,
    clearMessages: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    auth: state.auth,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, { register, clearMessages })(withRouter(Register));

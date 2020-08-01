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
import { setMessage, clearMessages } from '../../actions/messageActions';

// bring in password validator schema
import validatePassword from '../../utils/validatePassword';

const Register = ({ register, setMessage, clearMessages, history, errorMessages, auth: { loading, isAuthenticated } }) => {
    // clear errors when component loads
    useEffect(() => {
        clearMessages();
    }, [clearMessages]);

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

    // local form validation error message state
    const [formErrors, setFormErrorMessage] = useState({
        password2error: '',
    });

    // destructure error messages
    const { password2error } = formErrors;

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();

        // form validation
        const errors = {};
        if (firstName === '') errors.firstName = { msg: 'First name is required', alertType: 'success' };

        if (lastName === '') errors.lastName = { msg: 'Last name is required' };

        if (!validator.validate(email)) errors.email = { msg: 'Please enter a valid email' };

        if (!validatePassword(password)) errors.password = { msg: 'Password does not meet criteria' };

        if (password !== password2) errors.password2 = { msg: 'Passwords do not match' };

        if (Object.keys(errors).length > 0) {
            setMessage(errors);
        } else {
            register({
                firstName,
                lastName,
                email,
                password,
                history,
            });
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

                <div className='landing-inner-form row'>
                    <div className='col-md-6 m-auto'>
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
                                        />
                                        <h6 className='small text-danger'>{errorMessages && errorMessages.firstName && errorMessages.firstName.msg}</h6>
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
                                        />
                                        <h6 className='small text-danger'>{errorMessages && errorMessages.lastName && errorMessages.lastName.msg}</h6>
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
                                        />
                                        <h6 className='small text-danger'>{errorMessages && errorMessages.email && errorMessages.email.msg}</h6>
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
                                        />
                                        <h6 className='small text-danger'>{errorMessages && errorMessages.password && errorMessages.password.msg}</h6>
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
                                        />
                                        <h6 className='small text-danger'>{errorMessages && errorMessages.password2 && errorMessages.password2.msg}</h6>
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
    setMessage: PropTypes.func.isRequired,
    clearMessages: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    auth: state.auth,
    errorMessages: state.message.authMessages,
});

export default connect(mapStatetoProps, { register, setMessage, clearMessages })(withRouter(Register));

import React, { useState, useEffect } from 'react';
import { Link, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in components
import DisplayAlert from '../layout/Alert';

// bring in bootstrap components
import Alert from 'react-bootstrap/Alert';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setAlert } from '../../actions/alertActions';
import { login } from '../../actions/authActions';
import { clearMessages } from '../../actions/messageActions';

const Login = ({ setAlert, login, clearMessages, isAuthenticated }) => {
    // clear errors when component loads
    useEffect(() => {
        clearMessages();
    }, [clearMessages]);

    // init local state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // destructure
    const { email, password } = formData;

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();
        if (email === '' || password === '') {
            setAlert('Please enter all fields', 'danger');
        } else {
            login({
                email,
                password,
            });
        }
    };

    // redirect if logged in
    if (isAuthenticated) {
        return <Redirect to='/dashboard' />;
    }

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
                    <div className='col-md-6 m-auto'>
                        <div className='card card-body border-dark card-shadow'>
                            <h1 className='text-center mb-3'>
                                <i className='fas fa-sign-in-alt'></i> Login
                            </h1>

                            <DisplayAlert />

                            {false && (
                                <Alert variant='light' dismissible show='false'>
                                    <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                                </Alert>
                            )}

                            <form onSubmit={onSubmit}>
                                <div className='form-group'>
                                    <label className='mb-0' htmlFor='email'>
                                        Email
                                    </label>
                                    <input
                                        type='email'
                                        name='email'
                                        className='form-control  form-control-sm'
                                        placeholder='Enter Email'
                                        autoComplete='username'
                                        value={email}
                                        onChange={onChange}
                                    />
                                </div>
                                <div className='form-group'>
                                    <label className='mb-0' htmlFor='password'>
                                        Password
                                    </label>
                                    <input
                                        type='password'
                                        name='password'
                                        className='form-control form-control-sm'
                                        placeholder='Enter Password'
                                        autoComplete='current-password'
                                        value={password}
                                        onChange={onChange}
                                    />
                                </div>
                                <button type='submit' className='btn btn-primary btn-block'>
                                    Login
                                </button>
                            </form>
                            <p className='lead mt-4'>
                                No Account? <Link to='/register'>Register</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

Login.propTypes = {
    setAlert: PropTypes.func.isRequired,
    clearMessages: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool,
};

const mapStatetoProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStatetoProps, { clearMessages, setAlert, login })(Login);

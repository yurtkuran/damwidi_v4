import React, { Fragment, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setAlert } from '../../actions/alertActions';
import { login } from '../../actions/authActions';

const Login = ({ setAlert, login, isAuthenticated }) => {
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
        <Fragment>
            <h1 className='large text-primary'>Sign In</h1>
            <p className='lead'>
                <i className='fas fa-user'></i> Sign into your account
            </p>

            <form className='form' onSubmit={onSubmit}>
                <div className='form-group'>
                    <input type='email' placeholder='Email Address' name='email' value={email} onChange={onChange} />
                </div>

                <div className='form-group'>
                    <input type='password' placeholder='Password' name='password' value={password} onChange={onChange} minLength='6' />
                </div>

                <input type='submit' value='Register' className='btn btn-primary' />
            </form>

            <p className='my-1'>
                Don't have an account? <Link to='/register'>Sign Up</Link>
            </p>
        </Fragment>
    );
};

Login.propTypes = {
    setAlert: PropTypes.func.isRequired,
    login: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool,
};

const mapStatetoProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStatetoProps, { setAlert, login })(Login);

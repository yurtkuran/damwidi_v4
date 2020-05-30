import React, { Fragment, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setAlert } from '../../actions/alertActions';
import { register } from '../../actions/authActions';

const Register = ({ setAlert, register, isAuthenticated }) => {
    // init local state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password2: '',
    });

    // destructure
    const { name, email, password, password2 } = formData;

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();
        // if (name === '' || email === '' || password === '') {
        //     setAlert('Please enter all fields', 'danger');
        // } else if (password !== password2) {
        //     setAlert('Passwords do not match', 'danger');
        if (password !== password2) {
            setAlert('Passwords do not match', 'danger');
        } else {
            register({
                name,
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
            <h1 className='large text-primary'>Sign Up</h1>
            <p className='lead'>
                <i className='fas fa-user'></i> Create your account
            </p>

            <form className='form' onSubmit={onSubmit}>
                <div className='form-group'>
                    <input type='text' placeholder='Name' name='name' value={name} onChange={onChange} />
                </div>

                <div className='form-group'>
                    <input type='email' placeholder='Email Address' name='email' value={email} onChange={onChange} />
                    <small className='form-text'>This site uses Gravatar, so if you want a profile image, use a Gravatar email</small>
                </div>

                <div className='form-group'>
                    <input type='password' placeholder='Password' name='password' value={password} onChange={onChange} />
                </div>

                <div className='form-group'>
                    <input type='password' placeholder='Confirm Password' name='password2' value={password2} onChange={onChange} />
                </div>

                <input type='submit' value='Register' className='btn btn-primary' />
            </form>

            <p className='my-1'>
                Already have an account? <Link to='/login'>Sign In</Link>
            </p>
        </Fragment>
    );
};

Register.propTypes = {
    setAlert: PropTypes.func.isRequired,
    register: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool,
};

const mapStatetoProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStatetoProps, { setAlert, register })(Register);

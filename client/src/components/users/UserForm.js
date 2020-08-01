import React, { useState, useEffect } from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';
import Moment from 'react-moment';
import PropTypes from 'prop-types';
import validator from 'email-validator';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { updateUser, validate } from '../../actions/userActions';
import { clearMessages } from '../../actions/messageActions';

// set initial state
const initialState = {
    firstName: '',
    lastName: '',
    emaail: '',
    isVerified: false,
    isMember: false,
    isAdmin: false,
};

const initialErrorState = {
    firstName: '',
    lastName: '',
    email: '',
};

const UserForm = ({ updateUser, validate, clearMessages, current, errorMessages, history }) => {
    // init local form data
    const [formData, setFormData] = useState(current);

    // init form error messages
    const [errorMessage, setErrorMessage] = useState(initialErrorState);

    // load profile when component loads
    useEffect(() => {
        setFormData(current);
    }, [setFormData, current]);

    useEffect(() => {
        if (errorMessages) {
            errorMessages.forEach((error) => {
                setErrorMessage({ ...errorMessage, [error.field]: error.msg });
                clearMessages(error.field);
            });
        }
        // eslint-disable-next-line
    }, [clearMessages, setErrorMessage, errorMessages]);

    // destructure form fields
    const { _id, firstName, lastName, email, isVerified, isMember, isAdmin } = formData;

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
                if (!validator.validate(email)) {
                    error = 'Invald email';
                } else if (email !== current.email) {
                    error = !(await validate({ email })) ? 'Email aready in use' : '';
                } else {
                    error = '';
                }
                break;
            default:
                break;
        }
        setErrorMessage({ ...errorMessage, [field]: error });
        return error.length === 0 ? true : false;
    };

    // on change handler
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // on submit handlers
    const onSubmit = async (e) => {
        e.preventDefault();

        // validate form before submitting
        var isFormValid = true;
        const fields = Object.keys(errorMessage);
        for (const field of fields) {
            isFormValid = await validateFields(field);
            // console.log(field, isFormValid);
            if (!isFormValid) break;
        }

        if (isFormValid) {
            console.log('valid form');
            console.log(formData);
            updateUser(formData, history);
        } else {
            console.log('invalid form');
        }
    };

    return (
        <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
            <h4>Update User</h4>
            <div className='card card-body border-secondary card-shadow'>
                <form onSubmit={onSubmit}>
                    <input type='hidden' id='hiddenid' name='id' value='' />
                    <input type='hidden' id='hiddencreatedAt' name='createdAt' value='' />
                    <input type='hidden' id='hiddenupdatedAt' name='updatedAt' value='' />

                    <div className='form-group row'>
                        <div className='col-sm-6'>
                            <label for='inputFirstname'>First Name</label>
                            <input
                                type='text'
                                id='inputFirstname'
                                name='firstName'
                                className='form-control'
                                placeholder='Enter First Name'
                                value={firstName}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.name)}
                            />
                            <h6 className='small text-danger'>{errorMessage.firstName !== '' && errorMessage.firstName}</h6>
                        </div>
                        <div className='col-sm-6'>
                            <label for='inputLastname'>Last Name</label>
                            <input
                                type='text'
                                id='inputLastname'
                                name='lastName'
                                className='form-control'
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
                            <label for='inputEmail'>Email</label>
                            <input
                                type='text'
                                id='inputEmail'
                                name='email'
                                className='form-control'
                                placeholder='Enter Email'
                                value={email}
                                onChange={onChange}
                                onBlur={async (e) => await validateFields(e.target.name)}
                            />
                            <h6 className='small text-danger'>{errorMessage.email !== '' && errorMessage.email}</h6>
                        </div>
                    </div>

                    <div className='row justify-content-center border-top border-bottom m-0 py-3'>
                        <div className='col-sm-2 form-check form-check-inline'>
                            <input
                                className='form-check-input'
                                name='isVerified'
                                type='checkbox'
                                checked={isVerified}
                                value={isVerified}
                                onChange={() => {
                                    setFormData({ ...formData, isVerified: !isVerified });
                                }}
                            />
                            <label className='form-check-label' for='defaultCheck1'>
                                Verified
                            </label>
                        </div>

                        <div className='col-sm-2 form-check form-check-inline'>
                            <input
                                className='form-check-input'
                                name='isMember'
                                type='checkbox'
                                checked={isMember}
                                value={isMember}
                                onChange={() => {
                                    setFormData({ ...formData, isMember: !isMember });
                                }}
                            />
                            <label className='form-check-label' for='defaultCheck2'>
                                Member
                            </label>
                        </div>
                        <div className='col-sm-1 form-check form-check-inline'>
                            <input
                                className='form-check-input'
                                name='isAdmin'
                                type='checkbox'
                                checked={isAdmin}
                                value={isAdmin}
                                onChange={() => {
                                    setFormData({ ...formData, isAdmin: !isAdmin });
                                }}
                            />
                            <label className='form-check-label' for='defaultCheck3'>
                                Admin
                            </label>
                        </div>
                    </div>
                    <div className='row justify-content-center border-bottom m-0 py-3'>
                        <div className='col-sm-4 text-muted'>
                            created: <Moment format='YYYY/MM/DD'>{current.createdAt}</Moment>
                        </div>
                        <div className='col-sm-4 text-muted'>
                            last update: <Moment format='YYYY/MM/DD'>{current.updatedAt}</Moment>
                        </div>
                    </div>
                    <div className='row justify-content-end'>
                        <Link to='/users' className=' btn btn-secondary m-3 rounded'>
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

UserForm.propTypes = {
    current: PropTypes.object.isRequired,
    updateUser: PropTypes.func.isRequired,
    clearMessages: PropTypes.func.isRequired,
    validate: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.user.current,
    errorMessages: state.message,
});

export default connect(mapStatetoProps, { updateUser, validate, clearMessages })(UserForm);

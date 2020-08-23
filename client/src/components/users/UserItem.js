import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { setCurrent } from '../../actions/userActions';

const UserItem = ({ user, setCurrent, setShow, setMessage }) => {
    // destructure user object
    const { firstName, lastName, email, isVerified, isMember, isAdmin } = user;

    const handleDelete = (id) => {
        setCurrent(user);
        setMessage(`Are you sure you want to delete ${firstName} ${lastName}?`);
        setShow(true);
    };

    return (
        <tr>
            <td>
                {lastName}, {firstName}
            </td>
            <td>{email}</td>
            <td className='text-center'>
                <i className={isVerified ? 'fas fa-check' : 'fas fa-times'}></i>
            </td>
            <td className='text-center'>
                <i className={isMember ? 'fas fa-check' : 'fas fa-times'}></i>
            </td>
            <td className='text-center'>
                <i className={isAdmin ? 'fas fa-check' : 'fas fa-times'}></i>
            </td>
            <td className='text-center text-primary'>
                <Link to='/modifyuser' onClick={() => setCurrent(user)}>
                    <i className='far fa-edit'></i>
                </Link>
            </td>
            <td className='text-center text-primary'>
                <Link to='#' onClick={() => handleDelete(user._id)}>
                    <i className='far fa-trash-alt'></i>
                </Link>
            </td>
        </tr>
    );
};

UserItem.propTypes = {
    setCurrent: PropTypes.func.isRequired,
    setShow: PropTypes.func.isRequired,
    setMessage: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
};

export default connect(null, { setCurrent })(UserItem);

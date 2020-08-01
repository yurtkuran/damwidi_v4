import React, { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';

// bring in components
import Spinner from '../layout/Spinner';
import ModalConfirm from '../layout/ModalConfirm';
import UserItem from './UserItem';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getUsers, deleteUser, clearCurrent } from '../../actions/userActions';

const Users = ({ getUsers, deleteUser, clearCurrent, user: { users, loading, current } }) => {
    // load users when component loads
    useEffect(() => {
        getUsers();
    }, [getUsers]);

    // modal props
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    // hande delete confirmation
    const handleClose = (action = '') => {
        setShow(false);
        if (action === 'delete') deleteUser(current._id);
        clearCurrent();
    };

    return loading ? (
        <Spinner />
    ) : (
        <Fragment>
            <ModalConfirm show={show} setShow={setShow} handleClose={handleClose} message={message} title={'Confirm Deletion'} />
            <h3 className=''>Users</h3>
            <table className='table table-bordered table-striped'>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th className='text-center'>Verified</th>
                        <th className='text-center'>Member</th>
                        <th className='text-center'>Admin</th>
                        <th className='text-center' colSpan='2'>
                            Controls
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <UserItem key={user._id} user={user} setShow={setShow} setMessage={setMessage} />
                    ))}
                </tbody>
            </table>
        </Fragment>
    );
};

Users.propTypes = {
    user: PropTypes.object.isRequired,
    getUsers: PropTypes.func.isRequired,
    deleteUser: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    user: state.user,
});

export default connect(mapStatetoProps, { getUsers, deleteUser, clearCurrent })(Users);

import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in bootstrap components
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { logout } from '../../actions/authActions';

const AppNavbar = ({ auth: { isAuthenticated, loading, user }, logout }) => {
    const authLinks = (
        <Nav className='ml-auto'>
            <NavDropdown title='Info' id='basic-nav-dropdown'>
                <NavDropdown.Item href='#'>S&P 500 Companies</NavDropdown.Item>
                <NavDropdown.Item href='#'>Basket Data</NavDropdown.Item>
            </NavDropdown>

            {user !== null && user.isAdmin && (
                <NavDropdown title='Admin' id='basic-nav-dropdown'>
                    <NavDropdown.Item href='#'>Sectors</NavDropdown.Item>
                    <NavDropdown.Item href='#'>Stocks</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href='/users'>Users</NavDropdown.Item>
                    <NavDropdown.Item href='#'>Users Log</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href='#'>Unstick Log</NavDropdown.Item>
                </NavDropdown>
            )}
            {user !== null && isAuthenticated && <Nav.Link onClick={logout}>{user.firstName}: Logout</Nav.Link>}
        </Nav>
    );

    const guestLinks = (
        <Nav className='ml-auto'>
            <Nav.Link href='/register'>Register</Nav.Link>
            <Nav.Link href='/login'>Login</Nav.Link>
        </Nav>
    );

    return (
        <Navbar className='py-1' expand='sm' bg='custom' variant='dark'>
            <Navbar.Brand className='pr-3' href='/'>
                DAMWIDI Investments
            </Navbar.Brand>

            {!loading && isAuthenticated && (
                <Nav className='mr-auto'>
                    <Nav.Link href='#home'>Home</Nav.Link>
                    <Nav.Link href='#link'>Link</Nav.Link>
                    <NavDropdown title='Dropdown' id='basic-nav-dropdown'>
                        <NavDropdown.Item href='#action/3.1'>Action</NavDropdown.Item>
                        <NavDropdown.Item disabled href='#action/3.2'>
                            Another action
                        </NavDropdown.Item>
                        <NavDropdown.Item href='#action/3.3'>Something</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item href='#action/3.4'>Separated link</NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            )}

            {!loading && <Fragment> {isAuthenticated ? authLinks : guestLinks}</Fragment>}
        </Navbar>
    );
};

AppNavbar.propTypes = {
    logout: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    auth: state.auth,
});

export default connect(mapStatetoProps, { logout })(AppNavbar);

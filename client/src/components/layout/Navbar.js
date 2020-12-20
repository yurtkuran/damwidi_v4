import React, { Fragment } from 'react';
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
        <Nav className='ml-auto '>
            {user !== null && user.isAdmin && (
                <NavDropdown title='Admin' id='basic-nav-dropdown'>
                    <NavDropdown.Item href='/sectors'>Sectors</NavDropdown.Item>
                    <NavDropdown.Item href='/stocks'>Stocks</NavDropdown.Item>
                    <NavDropdown.Item href='/etfs'>ETF's</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href='/users'>Users</NavDropdown.Item>
                    <NavDropdown.Item href='/userlog'>Users Log</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href='/unstick'>Unstick Log</NavDropdown.Item>
                    <NavDropdown.Item href='/iexstatus'>IEX Details</NavDropdown.Item>
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
        <Navbar className='py-1 mb-5' expand='sm' bg='custom' variant='dark' fixed='top'>
            <Navbar.Brand className='pr-3' href='/'>
                DAMWIDI Investments
            </Navbar.Brand>

            {!loading && isAuthenticated && (
                <Nav className='mr-auto'>
                    <Nav.Link href='/dashboard'>Home</Nav.Link>
                    {user && user.isMember && <Nav.Link href='#'>Allocation</Nav.Link>}
                    <NavDropdown title='Charts' id='basic-nav-dropdown'>
                        <NavDropdown.Item href='#action/3.1'>Action</NavDropdown.Item>
                        <NavDropdown.Item disabled href='#action/3.2'>
                            Another action
                        </NavDropdown.Item>
                        <NavDropdown.Item href='#action/3.3'>Something</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item href='#action/3.4'>Separated link</NavDropdown.Item>
                    </NavDropdown>
                    {user && user.isMember && (
                        <>
                            <Nav.Link href='/tradehistory'>Trade History</Nav.Link>
                            <Nav.Link href='/minutes'>Minutes</Nav.Link>
                            <NavDropdown title='Index Data'>
                                <NavDropdown.Item href='/sp500components'>S&P 500</NavDropdown.Item>
                                <NavDropdown.Item href='/etflist'>ETF's</NavDropdown.Item>
                                <NavDropdown.Item href='/stockData'>Stocks</NavDropdown.Item>
                                <NavDropdown.Item href='#'>Basket Data</NavDropdown.Item>
                            </NavDropdown>
                        </>
                    )}
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

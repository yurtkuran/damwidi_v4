import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';
import ModalConfirm from '../layout/ModalConfirm';
import EtfItem from './Etfitem';

// bring in actions
import { getETFs, deleteETF, clearCurrent } from '../../actions/etfActions';

// bring in functions and hooks

const Etf = ({ etf: { etfs, current, loading }, getETFs, deleteETF, clearCurrent }) => {
    // load etfs when component loads, clear current stock
    useEffect(() => {
        getETFs();
    }, [getETFs]);

    // modal props
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    // hande delete confirmation
    const handleClose = (action = '') => {
        setShow(false);
        if (action === 'delete') deleteETF(current._id);
        clearCurrent();
    };

    return loading ? (
        <Spinner />
    ) : (
        <>
            <ModalConfirm show={show} setShow={setShow} handleClose={handleClose} message={message} title={'Confirm Deletion'} />
            <div className='col-sm-10 m-auto'>
                <h4 className=''>
                    <Link to='/etfform'>
                        <i className='fas fa-plus mr-3'></i>
                    </Link>
                    ETF's
                </h4>
                <table className='table table-bordered table-striped'>
                    <thead>
                        <tr>
                            <th className='text-center'>Symbol</th>
                            <th className='text-left'>Description</th>
                            <th className='text-center' colSpan='3'>
                                Controls
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {etfs
                            .sort((a, b) => {
                                return a['symbol'] < b['symbol'] ? -1 : a['symbol'] > b['symbol'] ? 1 : 0;
                            })
                            .map((etf) => (
                                <EtfItem key={etf._id} etf={etf} setShow={setShow} setMessage={setMessage} />
                            ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

Etf.propTypes = {
    getETFs: PropTypes.func.isRequired,
    deleteETF: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
    etf: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    etf: state.etf,
});

export default connect(mapStatetoProps, { getETFs, deleteETF, clearCurrent })(Etf);

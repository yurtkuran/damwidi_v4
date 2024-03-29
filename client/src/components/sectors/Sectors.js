import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

// bring in dependencies
import './sectors.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';
import ModalConfirm from '../layout/ModalConfirm';
import SectorItem from './SectorItem';

// bring in actions
import { getSectors, updateSectorWeight, updateSectorWeightsFromImport, clearCurrent, deleteSector } from '../../actions/sectorActions';

// bring in functions and hooks

// sort function
// https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
const dynamicSort = (property) => {
    var sortOrder = 1;
    if (property[0] === '-') {
        sortOrder = -1;
        property = property.substr(1);
    }
    return (a, b) => {
        var result;
        if (isNaN(a[property]) && isNaN(b[property])) {
            result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
        } else {
            result = a - b;
        }
        return result * sortOrder;
    };
};

// styling
const weightStyle = {
    color: 'black',
};

const errorWeightStyle = {
    color: 'red',
};

const Sectors = ({ sector: { sectors, loading, current }, getSectors, updateSectorWeight, updateSectorWeightsFromImport, clearCurrent, deleteSector }) => {
    // state to determine if okay to load page
    const [loadPage, setLoadPage] = useState(false);

    // state for table sort
    const [sort, setSort] = useState('symbol');

    // init form error messages
    const [errorMessage, setErrorMessage] = useState('');

    // state for button
    const [buttonText, setButtonText] = useState('Import Weights');
    const [buttonDisabled, setButtonDisabled] = useState(false);

    // ref to hold sector weights
    const sectorWeights = useRef({});

    // used to force an updated
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    // load sectors when component loads, clear current sector
    useEffect(() => {
        getSectors();
        clearCurrent();
    }, [getSectors, clearCurrent]);

    // load weights when loading completes
    useEffect(() => {
        let weights = {};
        if (!loading && sectors.length > 0) {
            sectors.filter((sector) => sector.type === 'S').map((sector) => (weights[sector.symbol] = sector.weight));
            sectorWeights.current = weights;
            if (Object.keys(sectorWeights.current).length !== 0) setLoadPage(true);
        }

        // calculate total weight
        let total = 0;
        sectors.filter((sector) => sector.type === 'S').map((sector) => (total += parseFloat(sector.weight)));
        total = parseFloat(total.toFixed(2));
        setErrorMessage(total !== 100 ? `Sector weights sum to ${total}%` : '');
    }, [loading, sectors]);

    useEffect(() => {
        setButtonText('Import Weights');
        setButtonDisabled(false);
    }, [sectors]);

    const onClick = () => {
        setButtonText('Importing');
        setButtonDisabled(true);
        updateSectorWeightsFromImport();
    };

    // hande weight update
    const updateWeight = (symbol, weight) => {
        sectorWeights.current = { ...sectorWeights.current, [symbol]: weight };
        forceUpdate(); // this is needed since react-contenteditable requires useRef and useRef does not rerender the page
    };

    // handle weight blur
    const blurWeight = (id, symbol) => {
        const prevWeight = sectors.find((sector) => {
            return sector.id === id;
        }).weight;
        if (sectorWeights.current[symbol] !== prevWeight && !isNaN(sectorWeights.current[symbol])) {
            setErrorMessage('');
            updateSectorWeight(id, symbol, sectorWeights.current[symbol]);
        } else {
            setErrorMessage(isNaN(sectorWeights.current[symbol]) ? 'database not updated, improper weight value' : '');
        }
    };

    // modal props
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    // hande delete confirmation
    const handleClose = (action = '') => {
        setShow(false);
        if (action === 'delete') deleteSector(current.id);
        clearCurrent();
    };

    return !loadPage ? (
        <Spinner />
    ) : (
        <div className='sector-container'>
            <ModalConfirm show={show} setShow={setShow} handleClose={handleClose} message={message} title={'Confirm Deletion'} />
            <div className='col-12 m-auto'>
                <div className='sector-header'>
                    <h4 className='sector-title'>
                        <Link className='noOutlineOnFocus' to='/sectorform'>
                            <i className='fas fa-plus mr-3'></i>
                        </Link>
                        Sectors
                    </h4>
                    <button className='btnn' onClick={onClick} disabled={buttonDisabled}>
                        {buttonText}
                    </button>
                </div>
                <table className='table table-bordered table-striped'>
                    <thead>
                        <tr>
                            <th className='text-center sortPointer' onClick={() => setSort('symbol')}>
                                Symbol {sort === 'symbol' && <i className='fas fa-sort-down'></i>}
                            </th>
                            <th className='text-left sortPointer' onClick={() => setSort('name')}>
                                Name {sort === 'name' && <i className='fas fa-sort-down'></i>}
                            </th>
                            <th className='text-left'>Description</th>
                            <th className='text-right sortPointer' onClick={() => setSort('weight')}>
                                Weight {sort === 'weight' && <i className='fas fa-sort-down'></i>}
                            </th>
                            <th className='text-center' colSpan='2'>
                                Controls
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectors
                            .filter((sector) => sector.type === 'S')
                            .sort(dynamicSort(sort))
                            .map((sector) => (
                                <SectorItem
                                    key={sector.id}
                                    sector={sector}
                                    weight={sectorWeights.current[sector.symbol]}
                                    setShow={setShow}
                                    setMessage={setMessage}
                                    updateWeight={updateWeight}
                                    blurWeight={blurWeight}
                                    weightStyle={!isNaN(sectorWeights.current[sector.symbol]) ? weightStyle : errorWeightStyle}
                                />
                            ))}
                    </tbody>
                </table>
                <h6 className='small text-danger text-right'>{errorMessage !== '' && errorMessage}</h6>
            </div>
        </div>
    );
};

Sectors.prototypes = {
    getSectors: PropTypes.func.isRequired,
    updateSectorWeight: PropTypes.func.isRequired,
    clearCurrent: PropTypes.func.isRequired,
    deleteSector: PropTypes.func.isRequired,
    sector: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    sector: state.sector,
});

export default connect(mapStatetoProps, { getSectors, updateSectorWeight, updateSectorWeightsFromImport, clearCurrent, deleteSector })(Sectors);

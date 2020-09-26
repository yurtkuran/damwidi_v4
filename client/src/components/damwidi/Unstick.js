import React, { useState, useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable, useExpanded } from 'react-table';
import BTable from 'react-bootstrap/Table';
import numeral from 'numeral';

// bring in components
import Spinner from '../layout/Spinner';
import UnstickPositions from './UnstickPositions';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getUnstick } from '../../actions/damwidiActions';

const Table = ({ columns, data, renderRowSubComponent }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, visibleColumns } = useTable(
        {
            columns,
            data,
        },
        useExpanded
    );

    return (
        <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps()} {...column.getHeaderProps({ className: column.headerClassName })}>
                                {column.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row, i) => {
                    prepareRow(row);
                    return (
                        <Fragment {...row.getRowProps()}>
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return <td {...cell.getCellProps({ className: cell.column.className })}>{cell.render('Cell')}</td>;
                                })}
                            </tr>
                            {row.isExpanded ? (
                                <tr>
                                    <td colSpan={visibleColumns.length}>{renderRowSubComponent(data[row.index])}</td>
                                </tr>
                            ) : null}
                        </Fragment>
                    );
                })}
            </tbody>
        </BTable>
    );
};

const Unstick = ({ damwidi: { unstick, loading }, getUnstick }) => {
    // local state to hide/display json details
    const [displayDetails, toggleDetails] = useState(false);

    // load unstick log when component loads
    useMemo(() => {
        getUnstick();
    }, [getUnstick]);

    // define table columne
    const columns = useMemo(
        () => [
            {
                Header: () => null, // No header
                id: 'expander', // It needs an ID
                Cell: ({ row }) => (
                    <span {...row.getToggleRowExpandedProps()}>{row.isExpanded ? <i className='far fa-caret-square-down'></i> : <i className='far fa-caret-square-right'></i>}</span>
                ),
            },
            {
                Header: 'Date',
                accessor: 'date',
                headerClassName: 'text-center',
                className: 'text-center',
            },
            {
                Header: 'Bivio',
                accessor: 'bivio_account_value',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (bivio_account_value) => numeral(bivio_account_value.value).format('$0,0.00'),
            },
            {
                Header: 'Damwidi',
                accessor: 'account_value',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (account_value) => numeral(account_value.value).format('$0,0.00'),
            },
            {
                Header: 'Cash',
                accessor: 'cash',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (cash) => numeral(cash.value).format('$0,0.00'),
            },
            {
                Header: 'Diff',
                accessor: 'unstickDelta',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (unstickDelta) => numeral(unstickDelta.value).format('$0,0.00'),
            },
            {
                Header: 'Source',
                accessor: 'source',
                headerClassName: 'text-right',
                className: 'text-right',
            },
        ],
        []
    );

    // Create a function that will render our row sub components
    const renderRowSubComponent = useCallback((data) => {
        return <UnstickPositions positions={data.positions} />;
    }, []);

    return loading ? (
        <Spinner />
    ) : (
        <>
            <h4>Unstick Log</h4>
            <Table columns={columns} data={unstick} renderRowSubComponent={renderRowSubComponent} />
            <div className='mt-2'>
                <button type='button' className='btn btn-light' onClick={() => toggleDetails(!displayDetails)}>
                    <i className='far fa-file-alt fa-lg text-info'></i> {displayDetails ? 'Hide' : 'Show'} Details
                </button>
            </div>
            {displayDetails && <pre>{JSON.stringify(unstick, null, 2)}</pre>}
        </>
    );
};

Unstick.propTypes = {
    damwidi: PropTypes.object.isRequired,
    getUnstick: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getUnstick })(Unstick);

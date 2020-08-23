import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTable, useGlobalFilter, useAsyncDebounce, usePagination, useSortBy } from 'react-table';
import Moment from 'react-moment';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getLogs } from '../../actions/userActions';

// Define a default UI for filtering
const GlobalFilter = ({ preGlobalFilteredRows, globalFilter, setGlobalFilter }) => {
    const count = preGlobalFilteredRows.length;
    const [value, setValue] = useState(globalFilter);
    const onChange = useAsyncDebounce((value) => {
        setGlobalFilter(value || undefined);
    }, 200);

    return (
        <div className='mb-2'>
            <input
                type='text'
                className='form-control'
                value={value || ''}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder={`Search ${count} records...`}
            />
        </div>
    );
};

const Table = ({ columns, data }) => {
    // Use the state and functions returned from useTable to build your UI
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        state,
        preGlobalFilteredRows,
        setGlobalFilter,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0 },
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    // render table UI
    return (
        <>
            <GlobalFilter preGlobalFilteredRows={preGlobalFilteredRows} globalFilter={state.globalFilter} setGlobalFilter={setGlobalFilter} />

            <table className='table table-sm table-bordered' {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())} {...column.getHeaderProps({ className: column.headerClassName })} width={column.width}>
                                    {column.render('Header')}
                                    <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return <td {...cell.getCellProps({ className: cell.column.className })}>{cell.render('Cell')}</td>;
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div style={PaginationStyles}>
                <div>
                    <button className='btn btn-sm btn-outline-secondary mr-1' onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                        <i className='fas fa-angle-double-left pt-1'></i>
                    </button>
                    <button className='btn btn-sm btn-outline-secondary mr-1' onClick={() => previousPage()} disabled={!canPreviousPage}>
                        <i className='fas fa-angle-left pt-1'></i>
                    </button>
                    <button className='btn btn-sm btn-outline-secondary mr-1' onClick={() => nextPage()} disabled={!canNextPage}>
                        <i className='fas fa-angle-right pt-1'></i>
                    </button>
                    <button className='btn btn-sm btn-outline-secondary' onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                        <i className='fas fa-angle-double-right pt-1'></i>
                    </button>
                </div>
                <div>
                    <strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </strong>{' '}
                </div>

                <div>
                    <select
                        className='form-control'
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                        }}
                    >
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    );
};

const UserLog = ({ log: { logs, loading }, getLogs }) => {
    useMemo(() => {
        return getLogs();
    }, [getLogs]);

    const columns = React.useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
                sortType: 'basic',
                filter: 'text',
                headerClassName: 'pl-4',
                className: 'pl-4',
            },
            {
                Header: 'Type',
                accessor: 'type',
                disableGlobalFilter: true,
                disableSortBy: true,
                width: '10%',
                headerClassName: 'text-center',
                className: 'text-center',
            },
            {
                Header: 'Date',
                accessor: 'date',
                disableGlobalFilter: true,
                sortType: 'basic',
                width: '30%',
                headerClassName: 'pl-4',
                className: 'pl-4',
                Cell: (date) => {
                    return <Moment format='YY/MM/DD HH:mm:ss'>{date.value}</Moment>;
                },
            },
        ],
        []
    );

    return loading ? (
        <h3>loading</h3>
    ) : (
        <div className='col-sm-10 m-auto'>
            <h1>User Log</h1>
            <div className='mb-2'></div>
            <Table columns={columns} data={logs} />
        </div>
    );
};

UserLog.propTypes = {
    getLogs: PropTypes.func.isRequired,
    log: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    log: state.log,
});

export default connect(mapStatetoProps, { getLogs })(UserLog);

const PaginationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

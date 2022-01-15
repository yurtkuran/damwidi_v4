import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable, useSortBy, usePagination, useGlobalFilter, useAsyncDebounce } from 'react-table';
import BTable from 'react-bootstrap/Table';
import numeral from 'numeral';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Spinner from '../layout/Spinner';

// bring in actions
import { getTradeHistory } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

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

            <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())} {...column.getHeaderProps({ className: column.headerClassName })} width={column.width}>
                                    {column.render('Header')}
                                    <span>
                                        {column.isSorted ? (
                                            column.isSortedDesc ? (
                                                <i className='far fa-caret-square-down pl-2'></i>
                                            ) : (
                                                <i className='far fa-caret-square-up pl-2'></i>
                                            )
                                        ) : (
                                            ''
                                        )}
                                    </span>
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
            </BTable>
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
                    </strong>
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

const TradeHistory = ({ damwidi: { history, loading }, getTradeHistory }) => {
    // load trade history when component loads
    useMemo(() => {
        getTradeHistory();
    }, [getTradeHistory]);

    // build columns
    const columns = useMemo(
        () => [
            {
                Header: 'Date',
                accessor: 'transaction_date',
                headerClassName: 'text-center',
                className: 'text-center',
                disableGlobalFilter: true,
                width: '60px',
            },
            {
                Header: 'Symbol',
                accessor: 'symbol',
                headerClassName: 'text-center',
                className: 'text-center',
                disableFilters: false,
                width: '60px',
            },
            {
                Header: 'Type',
                accessor: 'type',
                headerClassName: 'text-center',
                className: 'text-center',
                disableGlobalFilter: true,
                disableSortBy: true,
                width: '30px',
            },
            {
                Header: 'Shares',
                accessor: 'shares',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (shares) => numeral(shares.value).format('0,0.000'),
                disableGlobalFilter: true,
                disableSortBy: true,
                width: '40px',
            },
            {
                Header: 'Amount',
                accessor: 'amount',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (amount) => numeral(amount.value).format('$0.00'),
                disableGlobalFilter: true,
                disableSortBy: true,
                width: '60px',
            },
            {
                Header: 'Basis',
                id: 'basis',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (e) => {
                    // destructure
                    const { amount, shares } = e.cell.row.original;
                    return numeral(Math.abs(amount / shares)).format('$0.00');
                },
                width: '60px',
            },
            {
                Header: 'Description',
                accessor: 'description',
                disableFilters: false,
            },
        ],
        []
    );

    return loading ? (
        <Spinner />
    ) : (
        <div>
            <h4>Trade History</h4>
            <Table columns={columns} data={history} />
        </div>
    );
};

TradeHistory.propTypes = {
    getTradeHistory: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    damwidi: state.damwidi,
});

export default connect(mapStatetoProps, { getTradeHistory })(TradeHistory);

const PaginationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

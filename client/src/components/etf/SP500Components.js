import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable, useSortBy, usePagination, useFilters } from 'react-table';
import BTable from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import numeral from 'numeral';

// bring in components
import Spinner from '../layout/Spinner';

// bring in redux
import { connect } from 'react-redux';

// bring in actions
import { getSP500Components } from '../../actions/etfActions';

// Define a default UI for filtering
const DefaultColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => {
    const count = preFilteredRows.length;

    return (
        <Form.Control
            size='sm'
            type='text'
            value={filterValue || ''}
            onChange={(e) => {
                setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
        />
    );
};

// Select dropdown filter
const SelectColumnFilter = ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
    // Calculate the options for filtering using the preFilteredRows
    const options = React.useMemo(() => {
        const options = new Set();
        preFilteredRows.forEach((row) => {
            options.add(row.values[id]);
        });
        return [...options.values()];
    }, [id, preFilteredRows]);

    // Render a multi-select box
    return (
        // <select
        <Form.Control
            size='sm'
            as='select'
            value={filterValue}
            onChange={(e) => {
                setFilter(e.target.value || undefined);
            }}
        >
            <option value=''>All</option>
            {options.map((option, i) => (
                <option key={i} value={option}>
                    {option}
                </option>
            ))}
        </Form.Control>
    );
};

const Table = ({ columns, data }) => {
    // determing filter type for each column
    const filterTypes = useMemo(
        () => ({
            text: (rows, id, filterValue) => {
                return rows.filter((row) => {
                    const rowValue = row.values[id];
                    return rowValue !== undefined ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase()) : true;
                });
            },
        }),
        []
    );

    const defaultColumn = useMemo(() => ({ Filter: DefaultColumnFilter }), []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,

        // pagination
        page,
        pageCount,
        pageOptions,
        canPreviousPage,
        canNextPage,
        nextPage,
        gotoPage,
        previousPage,
        setPageSize,

        // filtering

        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            defaultColumn, // filtering
            filterTypes, // filtering
            initialState: { pageIndex: 0, pageSize: 20 },
        },
        useFilters,
        useSortBy,
        usePagination
    );

    return (
        <>
            <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps()} {...column.getHeaderProps({ className: column.headerClassName })} width={column.width}>
                                    <span {...column.getSortByToggleProps()}>
                                        {column.render('Header')}
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
                                    <div>{column.canFilter ? column.render('Filter') : null}</div>
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

const SP500Components = ({ etf: { sp500, loading }, getSP500Components }) => {
    // load data when components loads
    useMemo(() => {
        getSP500Components();
    }, [getSP500Components]);

    // build columns
    const columns = useMemo(
        () => [
            {
                Header: 'Symbol',
                accessor: 'symbol',
                disableFilters: false,
                Cell: (symbol) => (
                    <a target='_yahoo' href={`https://finance.yahoo.com/quote/${symbol.value}`}>
                        {symbol.value}
                    </a>
                ),
                width: '10%',
            },
            {
                Header: 'Name',
                accessor: 'name',
                disableFilters: false,
            },
            {
                Header: 'Sector',
                accessor: 'sectorMBA',
                disableFilters: false,
                Filter: SelectColumnFilter,
            },
            {
                Header: 'Weight',
                accessor: 'weight',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (weight) => numeral(weight.value).format('0,0.000') + '%',
                disableFilters: true,
                width: '10%',
            },
            {
                Header: 'Market Cap',
                accessor: 'marketCap',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (marketCap) => numeral(marketCap.value).format('$0.000a'),
                disableFilters: true,
                width: '10%',
            },
        ],
        []
    );

    return loading ? (
        <Spinner />
    ) : (
        <div>
            <h4>S&P 500 Components</h4>
            <Table columns={columns} data={sp500} />
        </div>
    );
};

SP500Components.propTypes = {
    getSP500Components: PropTypes.func.isRequired,
    etf: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    etf: state.etf,
});

export default connect(mapStatetoProps, { getSP500Components })(SP500Components);

const PaginationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

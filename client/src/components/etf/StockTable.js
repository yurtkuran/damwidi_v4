import React, { useMemo, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';
import './StockComponents.css';

// bring in dependencies
import { useTable, useSortBy, usePagination, useFilters, useExpanded } from 'react-table';
import BTable from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';

// bring in components
import StockInfo from './StockInfo';

// bring in redux

// bring in actions

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

const Table = ({ columns, data, renderRowSubComponent }) => {
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
        visibleColumns,

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
        useExpanded,
        usePagination
    );

    return (
        <>
            <BTable bordered size='sm' {...getTableProps()} className='dataTable'>
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
                            <Fragment key={i}>
                                <tr {...row.getRowProps({ className: 'stockRow' })}>
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

const StockTable = ({ stocks, columns }) => {
    // function to render row sub components
    const renderRowSubComponent = useCallback((data) => {
        return <StockInfo stockData={data} />;
    }, []);

    // add columns to columns prop
    const tableColumns = useMemo(
        () => [
            {
                Header: () => null, // No header
                id: 'expander', // It needs an ID
                width: '10px',
                className: 'text-center',
                Cell: ({ row }) => (
                    <span {...row.getToggleRowExpandedProps()}>{row.isExpanded ? <i className='far fa-caret-square-down'></i> : <i className='far fa-caret-square-right'></i>}</span>
                ),
            },
            ...columns,
        ],
        [columns]
    );

    return <Table columns={tableColumns} data={stocks} renderRowSubComponent={renderRowSubComponent} />;
};

StockTable.propTypes = {
    stocks: PropTypes.array.isRequired,
};

export default StockTable;

const PaginationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

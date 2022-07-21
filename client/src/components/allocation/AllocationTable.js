import React, { Fragment, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable, useExpanded } from 'react-table';
import numeral from 'numeral';

// bring in redux

// bring in components
import PurchaseTable from './PurchaseTable';

// bring in actions

// bring in functions and hooks

// set initial state

// Create a default prop getter
const defaultPropGetter = () => ({});

// display table
const Table = ({ columns, data, getCellProps = defaultPropGetter, getRowProps = defaultPropGetter, renderRowSubComponent }) => {
    const { getTableProps, getTableBodyProps, headerGroups, footerGroups, prepareRow, rows, visibleColumns } = useTable(
        {
            columns,
            data,
        },
        useExpanded
    );

    return (
        // <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
        <table {...getTableProps()} className='allocationTable'>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps({ className: column.headerClassName })} width={column.width}>
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
                        <Fragment key={i}>
                            {/* <tr {...row.getRowProps()}> */}
                            <tr {...row.getRowProps(getRowProps(row))}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps([{ className: cell.column.className }, getCellProps(cell)])}>
                                            {cell.render('Cell')}
                                        </td>
                                    );
                                })}
                            </tr>
                            {row.isExpanded ? (
                                <tr className='rowDetail'>
                                    <td colSpan={visibleColumns.length}>{renderRowSubComponent(data[row.index].symbol)}</td>
                                </tr>
                            ) : null}
                        </Fragment>
                    );
                })}
            </tbody>
            <tfoot>
                {footerGroups.map((group) => (
                    <tr {...group.getFooterGroupProps()}>
                        {group.headers.map((column) => (
                            <td {...column.getFooterProps([{ className: column.footerClassName }])} width={column.width}>
                                {column.render('Footer')}
                            </td>
                        ))}
                    </tr>
                ))}
            </tfoot>
        </table>
    );
};

const AllocationTable = ({ data: { allocationData, damData, prices }, performanceData }) => {
    const postitionTypes = 'ISKY';

    // function to render row sub components
    const renderRowSubComponent = useCallback(
        (symbol) => {
            return <PurchaseTable purchases={performanceData[symbol].purchases} symbol={symbol} price={prices[symbol]} />;
        },
        [performanceData, prices]
    );

    // build columns
    const columns = useMemo(
        () => [
            {
                Header: () => null, // No header
                id: 'expander', // It needs an ID
                width: '3%',
                className: 'text-center',
                Cell: ({ row }) => {
                    return (
                        row.original.shares > 0 &&
                        postitionTypes.indexOf(row.original.type) !== -1 && (
                            <span {...row.getToggleRowExpandedProps()}>
                                {row.isExpanded ? <i className='far fa-caret-square-down'></i> : <i className='far fa-caret-square-right'></i>}
                            </span>
                        )
                    );
                },
            },
            {
                accessor: 'symbol',
                Header: 'Symbol',
                headerClassName: 'text-left',
                className: 'text-left',
                Footer: () => {
                    return damData.symbol;
                },
                footerClassName: 'text-left',
                width: '10%',
            },
            {
                accessor: 'description',
                Header: 'Description',
                headerClassName: 'text-left',
                className: 'text-left',
                Footer: () => {
                    return damData.description;
                },
                footerClassName: 'text-left',
                // width: '20%',
            },
            {
                accessor: 'shares',
                Header: 'Shares',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (shares) => (parseFloat(shares.value) > 0 ? numeral(shares.value).format('0,0.000') : ''),
                width: '8%',
            },
            {
                accessor: 'currentValue',
                Header: 'Current Value',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (currentValue) => numeral(currentValue.value).format('$0,0.00'),
                Footer: () => {
                    return numeral(damData.currentValue).format('$0,0.00');
                },
                footerClassName: 'text-right',
                width: '10%',
            },
            {
                accessor: 'change',
                Header: 'Change',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (change) => numeral(change.value).format('$0,0.00'),
                width: '10%',
            },
            {
                accessor: 'allocation',
                Header: 'Allocation',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (allocation) => `${numeral(allocation.value).format('0.0')}%`,
                width: '8%',
            },
            {
                Header: 'Weight',
                headerClassName: 'text-right',
                className: 'text-right',
                width: '8%',
                Cell: ({ row: { original } }) => {
                    const { type, weight } = original;
                    return type === 'Y' && `${numeral(weight).format('0.0')}%`;
                },
            },
            {
                Header: 'Implied',
                headerClassName: 'text-right',
                className: 'text-right',
                width: '8%',
                Cell: ({ row: { original } }) => {
                    const { type, impliedPercent } = original;
                    return type === 'Y' && `${numeral(impliedPercent).format('0.0')}%`;
                },
            },
        ],
        [damData.currentValue, damData.description, damData.symbol]
    );

    return (
        <div>
            <Table
                columns={columns}
                data={allocationData}
                renderRowSubComponent={renderRowSubComponent}
                getRowProps={(row) => {
                    const { symbol, type } = row.original;

                    let rowClass = '';
                    if (symbol === 'SPY') {
                        rowClass = 'rowSPY';
                    } else if (type === 'Y') {
                        rowClass = 'rowSummary font-weight-bold';
                    }
                    return { className: rowClass };
                }}
                getCellProps={(cellInfo) => {
                    const {
                        column: { Header },
                        value,
                    } = cellInfo;
                    let cellClass = '';
                    if (Header === 'Change') {
                        if (value > 0) cellClass = 'valueUp';
                        if (value < 0) cellClass = 'valueDown';
                    }
                    return { className: cellClass };
                }}
            />
        </div>
    );
};

AllocationTable.propTypes = {
    data: PropTypes.object.isRequired,
    performanceData: PropTypes.object.isRequired,
};

export default AllocationTable;

import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable } from 'react-table';
import numeral from 'numeral';
import './AllocationTable.css';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks

// set initial state

// Create a default prop getter
const defaultPropGetter = () => ({});

// display table
const Table = ({ columns, data, getCellProps = defaultPropGetter }) => {
    const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
        columns,
        data,
    });

    return (
        // <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
        <table {...getTableProps()} className='tradeTable'>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps({ className: column.headerClassName })} width={column.width}>
                                {column.render('Header')}{' '}
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
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return <td {...cell.getCellProps([{ className: cell.column.className }, getCellProps(cell)])}>{cell.render('Cell')}</td>;
                                })}
                            </tr>
                        </Fragment>
                    );
                })}
            </tbody>
        </table>
    );
};

const PurchaseTable = ({ performanceData: { purchases, symbol } }) => {
    // build columns
    const columns = useMemo(() => [
        {
            accessor: 'dateBasis',
            Header: 'Date',
            headerClassName: 'text-left',
            className: 'text-left',
            width: '15%',
        },
        {
            accessor: 'priceBasis',
            Header: 'Price',
            headerClassName: 'text-right',
            Cell: (Price) => `${numeral(Price.value).format('0.00')}`,
            className: 'text-right',
            width: '15%',
        },
        {
            accessor: 'priceGain',
            Header: 'Gain',
            headerClassName: 'text-right',
            Cell: (priceGain) => `${numeral(priceGain.value).format('0.00')}%`,
            className: 'text-right',
            width: '15%',
        },
        {
            accessor: 'spyGain',
            Header: 'SPY Gain',
            headerClassName: 'text-right',
            Cell: (spyGain) => `${numeral(spyGain.value).format('0.00')}%`,
            className: 'text-right',
            width: '15%',
        },
        {
            Header: 'Above/Below',
            Cell: ({
                row: {
                    original: { priceGain, spyGain },
                },
            }) => {
                const gain = priceGain - spyGain;
                return `${numeral(gain).format('0.00')}% `;
            },
            headerClassName: 'text-right',
            className: 'text-right',
            width: '15%',
        },
    ]);
    return (
        <div className='purchaseTableContainer'>
            <h6>{symbol} purchases</h6>
            <Table
                columns={columns}
                data={purchases}
                getCellProps={(cellInfo) => {
                    const {
                        column: { Header },
                        row: {
                            original: { priceGain, spyGain },
                        },
                        value,
                    } = cellInfo;

                    let cellClass = '';
                    if (Header === 'Above/Below') {
                        const gain = priceGain - spyGain;
                        if (gain > 0) cellClass = 'valueUp';
                        if (gain < 0) cellClass = 'valueDown';
                    }

                    return { className: cellClass };
                }}
            />
        </div>
    );
};

PurchaseTable.propTypes = {
    performanceData: PropTypes.object.isRequired,
};

export default PurchaseTable;

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

// const upArrowClass = `fas fa-caret-up index-up gauge-arrow`;
// const downArrowClass = `fas fa-caret-down index-down gauge-arrow`;

// arrow component
const Change = ({ change }) => {
    return (
        <span className={`${change < 0 ? 'down' : 'up'}`}>
            <i className={`fas ${change < 0 ? 'fa-caret-down' : 'fa-caret-up'}`}></i>
            {numeral(Math.abs(change)).format('0.00')}
        </span>
    );
};

const PurchaseTable = ({ performanceData: { purchases, symbol, priceLast, pricePreviousClose } }) => {
    const change = priceLast - pricePreviousClose;

    // build columns
    const columns = useMemo(
        () => [
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
        ],
        []
    );
    return (
        <div className='purchaseTableContainer'>
            <div className='purchase-table-title'>
                <h6>{symbol} purchases</h6>
                <h6>
                    {/* last: {`${numeral(priceLast).format('$0.00')}`} <span className='up'> {`${numeral(change).format('+0.00')}`}</span>  */}
                    last: {`${numeral(priceLast).format('$0.00')}`} <Change change={change} />
                </h6>
            </div>
            <Table
                columns={columns}
                data={purchases}
                getCellProps={(cellInfo) => {
                    const {
                        column: { Header },
                        row: {
                            original: { priceGain, spyGain },
                        },
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

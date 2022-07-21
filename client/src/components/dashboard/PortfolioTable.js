//
// https://stackoverflow.com/questions/62152372/changing-column-width-in-react-table
//

import React, { Fragment, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable, useExpanded } from 'react-table';
import numeral from 'numeral';
import { round, gain } from '../../utils/round';
import './PortfolioTable.css';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import Performance from './Performance';
import Candlestick from '../charts/Candlestick';

// bring in actions
import { getOpenPositionsDetail } from '../../actions/damwidiActions';

// bring in functions and hooks

// set initial state

// Create a default prop getter
const defaultPropGetter = () => ({});

// display table
const Table = ({ columns, data, getCellProps = defaultPropGetter, renderRowSubComponent }) => {
    const { getTableProps, getTableBodyProps, headerGroups, footerGroups, prepareRow, rows, visibleColumns } = useTable(
        {
            columns,
            data,
        },
        useExpanded
    );

    return (
        // <BTable striped bordered hover size='sm' {...getTableProps()} className='dataTable'>
        <table {...getTableProps()} className='heatMapTable'>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps({ className: column.headerClassName, style: { width: column.width } })}>
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
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps([{ className: cell.column.className }, getCellProps(cell)])}>
                                            {cell.render('Cell')}
                                        </td>
                                    );
                                })}
                            </tr>
                            {row.isExpanded ? (
                                <tr>
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
                            <td {...column.getFooterProps([{ className: column.footerClassName }])}>{column.render('Footer')}</td>
                        ))}
                    </tr>
                ))}
            </tfoot>
        </table>
    );
};

const PortfolioTable = ({ sectors, prices, openPositionsDetailLoading, getOpenPositionsDetail }) => {
    // load open positions details when componen loads
    useEffect(() => {
        getOpenPositionsDetail();
    }, [getOpenPositionsDetail]);

    // function to render row sub components
    const renderRowSubComponent = useCallback(
        (symbol) => {
            return (
                !openPositionsDetailLoading && (
                    <div className='charts charts-secondary'>
                        <Candlestick symbol={symbol} type={'intraday'} simple={true} />
                        <Performance symbol={symbol} />
                    </div>
                )
            );
        },
        [openPositionsDetailLoading]
    );

    // define table data
    const tableData = useMemo(() => {
        return sectors
            .filter((position) => !'CF'.includes(position.type) && position.shares > 0)
            .map((position) => ({ ...position, price: prices[position.symbol].price }));
    }, [sectors, prices]);

    // DAM data used for footer
    const damData = useMemo(() => {
        return sectors.filter((position) => position.symbol === 'DAM').map((position) => ({ ...position, price: prices[position.symbol].price }))[0];
    }, [sectors, prices]);

    // build columns
    const columns = useMemo(
        () => [
            {
                Header: () => null, // No header
                id: 'expander', // It needs an ID
                width: '20px',
                className: 'text-center',
                Cell: ({ row }) => (
                    <span {...row.getToggleRowExpandedProps()}>
                        {row.isExpanded ? <i className='far fa-caret-square-down'></i> : <i className='far fa-caret-square-right'></i>}
                    </span>
                ),
            },
            {
                accessor: 'symbol',
                Header: 'Symbol',
                headerClassName: 'text-center',
                Footer: () => {
                    return damData.symbol;
                },
                footerClassName: 'text-center',
                className: 'text-center',
                width: '50px',
            },
            {
                Header: 'Description',
                accessor: 'description',
                headerClassName: 'text-left',
                className: 'text-left',
                width: '300px',
            },
            {
                Header: 'Basis',
                accessor: 'basis',
                Cell: (basis) => numeral(basis.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
                width: '70px',
            },
            {
                Header: 'Shares',
                accessor: 'shares',
                headerClassName: 'text-right',
                Cell: (prevClose) => numeral(prevClose.value).format('0,0.000'),
                className: 'text-right',
                width: '50px',
            },
            {
                Header: 'Previous',
                accessor: 'previous',
                Cell: (previous) => numeral(previous.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.previous).format('$0,0.00'),
                footerClassName: 'text-right',
                width: '85px',
            },
            {
                Header: 'Last',
                accessor: 'price',
                Cell: (price) => numeral(price.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
                width: '85px',
            },
            {
                Header: 'Price Change',
                accessor: 'priceChange',
                Cell: ({ row: { original } }) => {
                    const { price, previous } = original;
                    const gain = ((price - previous) / previous) * 100;
                    return `${numeral(gain).format('0.00')}% /  ${numeral(price - previous).format('$0,0.00')}`;
                },
                headerClassName: 'text-center',
                className: 'text-center',
                Footer: () => {
                    const { price, previous } = damData;
                    return `${numeral(round(gain(price, previous), 2)).format('0.00')}%`;
                },
                footerClassName: `text-center ${damData.price < damData.previous ? 'tickDown' : 'tickUp'}`,
                width: '120px',
            },
            {
                Header: 'Value',
                Cell: ({ row: { original } }) => {
                    const { shares, price } = original;
                    return numeral(shares * price).format('$0,0.00');
                },
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.price).format('$0,0.00'),
                footerClassName: 'text-right',
                width: '90px',
            },
            {
                Header: 'Change',
                accessor: 'change',
                Cell: ({ row: { original } }) => {
                    const { shares, price, previous } = original;
                    return numeral(shares * (price - previous)).format('$0,0.00');
                },
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.price - damData.previous).format('$0,0.00'),
                footerClassName: `text-right ${damData.price < damData.previous ? 'tickDown' : 'tickUp'}`,
                width: '50px',
            },
        ],
        [damData]
    );

    return (
        <Table
            columns={columns}
            data={tableData}
            getCellProps={(cellInfo) => {
                if (cellInfo.column.id === 'change' || cellInfo.column.id === 'priceChange') {
                    const { price, previous } = cellInfo.row.original;
                    return {
                        className: price < previous ? 'tickDown' : 'tickUp',
                    };
                }

                return { className: null };
            }}
            renderRowSubComponent={renderRowSubComponent}
        />
    );
};

PortfolioTable.propTypes = {
    sectors: PropTypes.array.isRequired,
    prices: PropTypes.object.isRequired,
    openPositionsDetailLoading: PropTypes.bool.isRequired,
    getOpenPositionsDetail: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    openPositionsDetailLoading: state.damwidi.openPositionsDetailLoading,
});

export default connect(mapStatetoProps, { getOpenPositionsDetail })(PortfolioTable);

import React, { Fragment, useMemo, useCallback } from 'react';

// bring in dependencies
import { useTable, useExpanded } from 'react-table';
import numeral from 'numeral';
import './PortfolioTable.css';

// bring in redux

// bring in components
import PositionDetail from './PositionDetail';

// bring in actions

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
                            <th {...column.getHeaderProps({ className: column.headerClassName })}>{column.render('Header')}</th>
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
                            {row.isExpanded ? (
                                <tr>
                                    <td colSpan={visibleColumns.length}>{renderRowSubComponent(data[row.index].sector)}</td>
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

const PortfolioTable = ({ data }) => {
    // function to render row sub components
    const renderRowSubComponent = useCallback((symbol) => {
        return <PositionDetail symbol={symbol} />;
    }, []);

    // define data
    const tableData = useMemo(
        () =>
            data
                .filter((position) => position.sector !== 'DAM')
                .sort((a, b) => {
                    return a.sector < b.sector ? -1 : a.sector > b.sector ? 1 : 0;
                }),
        [data]
    );

    const damData = useMemo(() => data.filter((position) => position.sector === 'DAM')[0], [data]);

    // build columns
    const columns = useMemo(
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
            {
                accessor: 'sector',
                Header: 'Symbol',
                headerClassName: 'text-center',
                Footer: () => {
                    return damData.sector;
                },
                footerClassName: 'text-center',
                className: 'text-center',
                width: '10%',
            },
            {
                Header: 'Description',
                accessor: 'description',
                headerClassName: 'text-left',
                className: 'text-left',
            },
            {
                Header: 'Basis',
                accessor: 'basis',
                Cell: (basis) => numeral(basis.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
            },
            {
                Header: 'Shares',
                accessor: 'shares',
                headerClassName: 'text-right',
                Cell: (prevClose) => numeral(prevClose.value).format('0,0'),
                className: 'text-right',
            },
            {
                Header: 'Previous',
                accessor: 'prevClose',
                Cell: (prevClose) => numeral(prevClose.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.prevClose).format('$0,0.00'),
                footerClassName: 'text-right',
            },
            {
                Header: 'Last',
                accessor: 'last',
                Cell: (last) => numeral(last.value).format('$0,0.00'),
                headerClassName: 'text-right',
                className: 'text-right',
            },
            {
                Header: 'Price Change',
                accessor: 'priceChange',
                Cell: ({ row: { original } }) => {
                    const { last, prevClose } = original;
                    const gain = ((last - prevClose) / prevClose) * 100;
                    return `${numeral(gain).format('0.00')}% /  ${numeral(last - prevClose).format('$0,0.00')}`;
                },
                headerClassName: 'text-center',
                className: 'text-center',
                Footer: `${numeral(damData.gain).format('0.00')}%`,
                footerClassName: `text-center ${damData.gain < 0 ? 'tickDown' : 'tickUp'}`,
            },
            {
                Header: 'Value',
                Cell: ({ row: { original } }) => {
                    const { shares, last } = original;
                    return numeral(shares * last).format('$0,0.00');
                },
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.currentValue).format('$0,0.00'),
                footerClassName: 'text-right',
            },
            {
                Header: 'Change',
                accessor: 'change',
                Cell: ({ row: { original } }) => {
                    const { shares, last, prevClose } = original;
                    return numeral(shares * (last - prevClose)).format('$0,0.00');
                },
                headerClassName: 'text-right',
                className: 'text-right',
                Footer: numeral(damData.currentValue - damData.prevClose).format('$0,0.00'),
                footerClassName: `text-right ${damData.gain < 0 ? 'tickDown' : 'tickUp'}`,
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
                    const { gain } = cellInfo.row.original;
                    return {
                        className: gain < 0 ? 'tickDown' : 'tickUp',
                    };
                }

                return { className: null };
            }}
            renderRowSubComponent={renderRowSubComponent}
        />
    );
};

export default PortfolioTable;

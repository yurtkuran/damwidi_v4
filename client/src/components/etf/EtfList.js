import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import { useTable } from 'react-table';
import BTable from 'react-bootstrap/Table';
import numeral from 'numeral';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import StockTable from './StockTable';
import Spinner from '../layout/Spinner';

// bring in actions
import { getETFs } from '../../actions/etfActions';

// bring in functions and hooks
import SelectColumnFilter from './SelectColumnFilter';

const Table = ({ columns, data, getRowProps }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
        columns,
        data,
    });

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
                        <tr {...row.getRowProps(getRowProps(row))}>
                            {row.cells.map((cell) => {
                                return <td {...cell.getCellProps({ className: cell.column.className })}>{cell.render('Cell')}</td>;
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </BTable>
    );
};

const EtfList = ({ etf: { etfs, loading }, getETFs }) => {
    // state handlers for etf or stock view
    const [veieETFs, setViewETFs] = useState(true);
    const [etfSymbol, setEtfSymbol] = useState('');
    const [holdings, setHoldings] = useState([]);

    // load etfs when component loads, clear current stock
    useMemo(() => {
        getETFs();
    }, [getETFs]);

    const onClickRow = (etf) => {
        let holdingList = etf.holdings;
        for (let holding of holdingList) {
            const { _id, weight, stock } = holding;
            const { symbol, ...stockDetail } = stock;
            holding = { _id, symbol, weight, ...stockDetail };
            holdingList = holdingList.map((holdingItem) => (holdingItem._id === holding._id ? holding : holdingItem));
        }

        setEtfSymbol(etf.symbol);
        setHoldings(holdingList);
        console.log(holdingList);
        setViewETFs(false);
    };

    // define table columns
    const columns = useMemo(
        () => [
            {
                Header: 'Symbol',
                accessor: 'symbol',
                headerClassName: 'text-center',
                className: 'text-center',
            },
            {
                Header: 'Description',
                accessor: 'description',
                headerClassName: 'text-left',
                className: 'text-left',
            },
            {
                Header: 'Weight Type',
                accessor: 'weightType',
                headerClassName: 'text-center',
                className: 'text-center',
            },
            {
                Header: 'Component Count',
                accessor: 'holdings',
                headerClassName: 'text-right',
                className: 'text-right',
                Cell: (holdings) => numeral(holdings.value.length).format('00'),
            },
        ],
        []
    );

    // define stock table columns
    const stockColumns = useMemo(
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
                accessor: 'companyName',
                disableFilters: false,
            },
            {
                Header: 'Sector',
                accessor: 'sector',
                disableFilters: false,
                Filter: SelectColumnFilter,
            },
            {
                Header: 'Industry',
                accessor: 'industry',
                disableFilters: false,
                Filter: SelectColumnFilter,
            },
            {
                Header: 'Weight',
                accessor: 'weight',
                headerClassName: 'text-right',
                className: 'text-right',
                sortDescFirst: true,
                Cell: (weight) => `${numeral(weight.value).format('0.000')}%`,
                disableFilters: true,
                width: '10%',
            },
            {
                Header: 'YTD',
                id: 'YTD',
                // accessor: (d) => Number(d.ytdChangePercent),

                accessor: (d) => Number(d.ytdChangePercent).toFixed(2),
                sortMethod: (a, b) => Number(a) - Number(b),

                // accessor: ytdChangePercent,
                headerClassName: 'text-right',
                className: 'text-right',
                sortDescFirst: true,
                // sortMethod: (a, b) => Number(a) - Number(b),
                // Cell: (ytdChangePercent) => `${numeral(ytdChangePercent.value * 100).format('0.00')}%`,
                disableFilters: true,
                width: '10%',
            },
        ],
        []
    );

    return loading ? (
        <Spinner />
    ) : (
        <>
            {veieETFs ? (
                <>
                    <h4>ETF's</h4>
                    <Table
                        columns={columns}
                        data={etfs}
                        getRowProps={(row) => ({
                            onClick: () => onClickRow(row.original),
                            style: {
                                cursor: 'pointer',
                            },
                        })}
                    />
                </>
            ) : (
                <>
                    <h4>
                        <span className='text-primary' style={BreadcrumbStyle} onClick={() => setViewETFs(true)}>
                            <i className='far fa-arrow-alt-circle-left'></i> ETF's
                        </span>
                        <i className='fas fa-angle-right fa-xs px-2'></i>
                        {etfSymbol}
                    </h4>
                    <StockTable stocks={holdings} columns={stockColumns} />
                </>
            )}
        </>
    );
};

EtfList.propTypes = {
    getETFs: PropTypes.func.isRequired,
    etf: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    etf: state.etf,
});

export default connect(mapStatetoProps, { getETFs })(EtfList);

const BreadcrumbStyle = {
    cursor: 'pointer',
};

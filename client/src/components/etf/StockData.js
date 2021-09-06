import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// bring in dependencies

// bring in redux
import { connect } from 'react-redux';

// bring in components
import StockTable from './StockTable';
import Spinner from '../layout/Spinner';

// bring in actions
import { getStockComponents } from '../../actions/etfActions';

// bring in functions
import SelectColumnFilter from './SelectColumnFilter';

const StockData = ({ etf: { stocks, loading }, getStockComponents }) => {
    // load stockes when component loads
    useEffect(() => {
        getStockComponents();
    }, [getStockComponents]);

    // build table columns
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
            // {
            //     Header: 'YTD',
            //     accessor: 'ytdChangePercent',
            //     headerClassName: 'text-right',
            //     className: 'text-right',
            //     sortDescFirst: true,
            //     Cell: (ytdChangePercent) => numeral(ytdChangePercent.value).format('0.000'),
            //     disableFilters: true,
            //     width: '10%',
            // },
            {
                Header: 'Component Of',
                accessor: 'componentOf',
                disableFilters: false,
                Cell: (componentOf) => {
                    return componentOf.value !== 'undefined' && componentOf.value.length > 0 ? componentOf.value.join(', ') : '';
                },
            },
        ],
        []
    );

    return loading ? (
        <Spinner />
    ) : (
        <div>
            <h4>Stock Data</h4>
            <StockTable stocks={stocks} columns={columns} />
        </div>
    );
};

StockData.propTypes = {
    getStockComponents: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
    etf: state.etf,
});

export default connect(mapStatetoProps, { getStockComponents })(StockData);

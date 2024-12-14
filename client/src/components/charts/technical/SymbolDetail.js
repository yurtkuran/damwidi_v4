import React from 'react';
import PropTypes from 'prop-types';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks
import useFetch from '../../../customHooks/useFetch';

// set initial state

// company name component
const CompanyName = ({ companyName, profile, isLoading }) => {
    const url = profile?.data?.homepage_url;
    const name =
        !isLoading && url  ? (
            <a href={`${url}`} target='_blank' rel='noopener noreferrer'>
                {profile.name}
            </a>
        ) : (
            companyName
        );
    return <> {name} </>;
};

const SymbolDetail = ({ symbol, data: { companyName, latestPrice, change, changePercent, week52High, week52Low } }) => {
    // load company profile
    const { data: profile, isLoading } = useFetch(`api/marketData/profile/${symbol}`);

    // set class based on value, used to set color either red or green
    let tickClass = '';
    if (change > 0) {
        tickClass = 'up';
    } else if (change < 0) {
        tickClass = 'down';
    }

    return symbol !== 'DAM' ? (
        <table className='symbolDetailTable'>
            <thead>
                <tr>
                    <th className='text-center'>Symbol</th>
                    <th>Name</th>
                    <th className='text-right'>Last</th>
                    <th className='text-right'>Change</th>
                    <th className='text-right'>Change %</th>
                    <th className='text-right'>52Wk High</th>
                    <th className='text-right'>52Wk Low</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className='text-center'>
                        <a target='_yahoo' href={`https://finance.yahoo.com/quote/${symbol}`}>
                            {symbol}
                        </a>
                    </td>
                    <td>
                        <CompanyName companyName={companyName} profile={profile} isLoading={isLoading} />
                    </td>
                    <td className='text-right'>{numeral(latestPrice).format('$0,0.00')}</td>
                    <td className={`text-right ${tickClass}`}>{numeral(change).format('$0.00')}</td>
                    <td className={`text-right ${tickClass}`}>{numeral(changePercent).format('0.00%')}</td>
                    <td className='text-right'>{numeral(week52High).format('$0,0.00')}</td>
                    <td className='text-right'>{numeral(week52Low).format('$0,0.00')}</td>
                </tr>
            </tbody>
        </table>
    ) : (
        <table className='symbolDetailTable'>
            <thead>
                <tr>
                    <th className='text-center'>Symbol</th>
                    <th>Name</th>
                    <th className='text-right'>52Wk High</th>
                    <th className='text-right'>52Wk Low</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className='text-center'>DAM</td>
                    <td>Damwidi Investments</td>
                    <td className='text-right'>{numeral(0).format('$0,0.00')}</td>
                    <td className='text-right'>{numeral(0).format('$0,0.00')}</td>
                </tr>
            </tbody>
        </table>
    );
};

SymbolDetail.propTypes = {
    data: PropTypes.object.isRequired,
};

export default SymbolDetail;

import React, { useState } from 'react';

// bring in dependencies
import numeral from 'numeral';

// bring in redux

// bring in components

// bring in actions

// bring in functions and hooks
import useFetch from '../../customHooks/useFetch';

// set initial state

const StockInfo = ({ stockData }) => {
    const [loading, setLoading] = useState(true);

    const { data: keyStats, isLoading, error } = useFetch(`api/marketData/keystats/${stockData.symbol}`);

    // destructure
    const { companyName, description, country, exchange, componentOf } = stockData;

    // format website
    let { website } = stockData;
    if (website && (website.indexOf('http://') !== -1 || website.indexOf('https://') !== -1)) {
        website = website.split('//').pop();
    }

    return (
        <div className='stockInfo'>
            {companyName && (
                <>
                    <div className='stockInfo__Performance'>
                        <h5>Performance: {companyName}</h5>
                        {!isLoading && keyStats && (
                            <table className='stockInfoTable dataTable'>
                                <thead>
                                    <tr>
                                        <th className='text-right stockPerformance'>1 Year</th>
                                        <th className='text-right stockPerformance'>YTD</th>
                                        <th className='text-right stockPerformance'>6 Mth</th>
                                        <th className='text-right stockPerformance'>3 Mth</th>
                                        <th className='text-right stockPerformance'>1 Mth</th>
                                        <th className='text-right stockPerformance'>5 Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className='text-right'>{numeral(keyStats.year1ChangePercent).format('0.00%')}</td>
                                        <td className='text-right'>{numeral(keyStats.ytdChangePercent).format('0.00%')}</td>
                                        <td className='text-right'>{numeral(keyStats.month6ChangePercent).format('0.00%')}</td>
                                        <td className='text-right'>{numeral(keyStats.month3ChangePercent).format('0.00%')}</td>
                                        <td className='text-right'>{numeral(keyStats.month1ChangePercent).format('0.00%')}</td>
                                        <td className='text-right'>{numeral(keyStats.day5ChangePercent).format('0.00%')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className='stockInfo__Details'>
                        <div>
                            P/E <p>{keyStats && numeral(keyStats.peRatio).format('0.00')}</p>
                        </div>
                        <div>
                            Country<p>{country}</p>
                        </div>
                        <div>
                            Exchange<p>{exchange}</p>
                        </div>
                        <div>
                            Website
                            <p>
                                <a target='_blank' rel='noopener noreferrer' href={`http://${website}`}>
                                    {website}
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className='stockInfo__Description'>
                        <p>{description}</p>
                    </div>
                </>
            )}

            <div className='stockInfo__ComponentOf'>
                {componentOf !== 'undefined' && componentOf.length > 0 && (
                    <>
                        <span>Component Of:</span> {componentOf.join(', ')}
                    </>
                )}
            </div>
        </div>
    );
};

export default StockInfo;

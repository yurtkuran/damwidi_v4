import React from 'react';

// bring in dependencies
import numeral from 'numeral';

// birng in components

const StockInfo = ({ stockData }) => {
    // destructure
    const {
        companyName,
        description,
        year1ChangePercent,
        ytdChangePercent,
        month6ChangePercent,
        month3ChangePercent,
        month1ChangePercent,
        day5ChangePercent,
        peRatio,
        country,
        exchange,
        componentOf,
    } = stockData;

    // format website
    let { website } = stockData;
    if (website && website.indexOf('http://') !== -1) {
        website = website.substring(website.indexOf('http://') + 'http://'.length);
    }

    return (
        <div className='stockInfo'>
            {companyName && (
                <>
                    <div className='stockInfo__Performance'>
                        <h5>Performance: {companyName}</h5>
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
                                    <td className='text-right'>{numeral(year1ChangePercent).format('0.00')}</td>
                                    <td className='text-right'>{numeral(ytdChangePercent).format('0.00')}</td>
                                    <td className='text-right'>{numeral(month6ChangePercent).format('0.00')}</td>
                                    <td className='text-right'>{numeral(month3ChangePercent).format('0.00')}</td>
                                    <td className='text-right'>{numeral(month1ChangePercent).format('0.00')}</td>
                                    <td className='text-right'>{numeral(day5ChangePercent).format('0.00')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className='stockInfo__Details'>
                        <div>
                            P/E <p>{peRatio}</p>
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
                                <a target='_blank' rel='noopener noreferrer' href={`https://${website}`}>
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

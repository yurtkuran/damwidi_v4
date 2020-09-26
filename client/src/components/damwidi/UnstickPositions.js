import React from 'react';

// bring in dependencies
import BTable from 'react-bootstrap/Table';
import numeral from 'numeral';

const UnstickPositions = ({ positions }) => {
    return (
        <BTable bordered size='sm' className='bg-white' style={{ fontSize: '12px' }}>
            <thead>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position) => (
                            <th className='text-right bg-white'>{position}</th>
                        ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position) => (
                            <td className='text-right'>{numeral(positions[position].close).format('$0,0.00')}</td>
                        ))}
                </tr>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position) => (
                            <td className='text-right'>{numeral(positions[position].shares).format('0,0')}</td>
                        ))}
                </tr>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position) => (
                            <td className='text-right'>{numeral(positions[position].shares * positions[position].close).format('$0,0.00')}</td>
                        ))}
                </tr>
            </tbody>
        </BTable>
    );
};

export default UnstickPositions;

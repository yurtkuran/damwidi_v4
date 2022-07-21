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
                        .map((position, i) => (
                            <th className='text-right bg-white' key={i}>
                                {position}
                            </th>
                        ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position, i) => (
                            <td className='text-right' key={i}>
                                {numeral(positions[position].close).format('$0,0.00')}
                            </td>
                        ))}
                </tr>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position, i) => (
                            <td className='text-right' key={i}>
                                {numeral(positions[position].shares).format('0,0.000')}
                            </td>
                        ))}
                </tr>
                <tr>
                    {Object.keys(positions)
                        .filter((position) => position !== 'provider')
                        .map((position, i) => (
                            <td className='text-right' key={i}>
                                {numeral(positions[position].shares * positions[position].close).format('$0,0.00')}
                            </td>
                        ))}
                </tr>
            </tbody>
        </BTable>
    );
};

export default UnstickPositions;

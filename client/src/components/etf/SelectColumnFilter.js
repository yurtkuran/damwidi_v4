import React, { useMemo } from 'react';
import Form from 'react-bootstrap/Form';

// Select dropdown filter
const SelectColumnFilter = ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
    // Calculate the options for filtering using the preFilteredRows
    const options = useMemo(() => {
        const options = new Set();
        preFilteredRows.forEach((row) => {
            options.add(row.values[id]);
        });
        return [...options.values()];
    }, [id, preFilteredRows]);

    // Render a multi-select box
    return (
        // <select
        <Form.Control
            size='sm'
            as='select'
            value={filterValue}
            onChange={(e) => {
                setFilter(e.target.value || undefined);
            }}
        >
            <option value=''>All</option>
            {options.map((option, i) => (
                <option key={i} value={option}>
                    {option}
                </option>
            ))}
        </Form.Control>
    );
};

export default SelectColumnFilter;

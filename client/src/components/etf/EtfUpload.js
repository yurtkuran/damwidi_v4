import React, { useState, useEffect } from 'react';

const initialMessageState = {
    message: '',
    type: '',
};

const EtfUpload = ({ onSubmit }) => {
    const [file, setFile] = useState();
    const [filename, setFileName] = useState('Choose File');
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [statusMessage, setStatusMessage] = useState(initialMessageState);

    useEffect(() => {
        setButtonDisabled(filename === 'Choose File' || file.type !== 'text/csv' ? true : false);

        if (file && file.type !== 'text/csv') {
            setStatusMessage({ message: `selected file is not in the correct format (CSV)`, type: 'text-danger' });
        } else {
            setStatusMessage(initialMessageState);
        }

        // if (filename === 'Choose File' || file.type !== 'text/csv') {
        //     setButtonDisabled(true);
        // } else {
        //     setButtonDisabled(false);
        // }
    }, [file, filename]);

    const onChange = (e) => {
        setFile(e.target.files[0]);
        setFileName(e.target.files[0].name);

        // if (e.target.files[0].type !== 'text/csv') {
        //     setStatusMessage({ message: `selected file is not in the correct format (CSV)`, type: 'text-danger' });
        // }
    };

    return (
        <>
            <form onSubmit={(e) => onSubmit(e, file)}>
                <div className='custom-file mb-2'>
                    <input type='file' className='custom-file-input' id='customFile' onChange={onChange} />
                    <label className='custom-file-label' htmlFor='customFile'>
                        {filename}
                    </label>
                </div>
                <input type='submit' value='Upload' className='btn btn-primary rounded float-right' disabled={buttonDisabled} />
            </form>
            <div className='messageBar'>
                <h6 className={`small text-success text-left pt-3 ${statusMessage !== '' && statusMessage.type}`}>{statusMessage !== '' && statusMessage.message}</h6>
            </div>
        </>
    );
};

export default EtfUpload;

// filename === 'Choose File' || file.type !== 'text/csv' ? true : false

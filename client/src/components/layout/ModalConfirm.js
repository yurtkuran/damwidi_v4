import React from 'react';

// bring in bootstrap components
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ModalConfirm = ({ show, message, title, handleClose }) => {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant='secondary rounded' onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant='primary rounded' onClick={() => handleClose('delete')}>
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalConfirm;

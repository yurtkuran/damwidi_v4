// https://codepen.io/bertdida/pen/EOdYxG

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import './EtfComponents.css';

// bring in dependencies
import Hotkeys from 'react-hot-keys';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'papaparse';

// bring in redux
import { connect } from 'react-redux';

// bring in components
import EtfUpload from './EtfUpload';

// bring in actions
import { addOrUpdateComponents } from '../../actions/etfActions';
import { validateSymbol } from '../../actions/iexActions';

// set initial form state
const initialFormState = {
    _id: '',
    symbol: '',
    weight: '',
    errorSymbol: false,
    errorWeight: false,
};

const initialMessageState = {
    message: '',
    type: '',
};

// form validation
const fieldList = ['symbol', 'weight'];
const validateFormSymbol = async (component, componentArray, error, updateStatus, setStatusMessage) => {
    // if symbol is blank
    if (component.symbol === '') {
        error = true;
        if (updateStatus) setStatusMessage({ message: `symbol required`, type: 'text-danger' });
    }

    // check if symbol is in use
    if (error === false) {
        for (const componentItem of componentArray) {
            if (componentItem._id !== component._id && componentItem.symbol.toUpperCase() === component.symbol) {
                error = true;
                if (updateStatus) setStatusMessage({ message: `symbol already in-use`, type: 'text-danger' });
            }
        }
    }

    // check if valid symbol an update company name
    if (error === false) {
        const companyData = await validateSymbol({ symbol: component.symbol.toUpperCase() });
        if (!companyData) {
            error = true;
            if (updateStatus) setStatusMessage({ message: `invalid symbol`, type: 'text-danger' });
        } else {
            if (updateStatus) setStatusMessage({ message: `${companyData.companyName}`, type: 'text-success' });
        }
    }
    return error;
};
const validateFormWeight = async (component, error, updateStatus, setStatusMessage) => {
    if (component.weight === '') {
        // if weight is blank
        if (updateStatus) setStatusMessage({ message: `weight required`, type: 'text-danger' });
        error = true;
    } else if (isNaN(component.weight)) {
        // check if weight is NaN
        if (updateStatus) setStatusMessage({ message: `weight must be a number`, type: 'text-danger' });
        error = true;
    } else {
        // set status message to blank
        if (updateStatus) setStatusMessage(initialMessageState);
    }
    return error;
};

const EtfComponents = ({ current: { _id, symbol, holdings, weightType }, addOrUpdateComponents, validateSymbol, history }) => {
    // local state
    const [components, setComponents] = useState([initialFormState]);

    // init form error messages
    const [errorMessage, setErrorMessage] = useState('');

    // init form symbol status messages
    const [statusMessage, setStatusMessage] = useState(initialMessageState);

    // load etf components into form
    useEffect(() => {
        setComponents(holdings);
    }, [holdings]);

    // calculate total weight from fields
    useEffect(() => {
        let total = 0;
        components.map((component) => (total += component.weight === '' || isNaN(component.weight) || component.weight === null ? 0 : parseFloat(component.weight)));

        setErrorMessage(total !== 100 && components.length !== 0 ? `ETF weights sum to ${total}%` : '');
    }, [components]);

    // add new field
    const onClickAdd = (e) => {
        e.preventDefault();
        setComponents([...components, { ...initialFormState, _id: uuidv4() }]);
        setStatusMessage(initialMessageState);
    };

    // remove field
    const onClickRemove = (componentId) => {
        setComponents((currComponents) => currComponents.filter((component) => component._id !== componentId));
        setStatusMessage(initialMessageState);
    };

    // redirect to view all ETF's
    const onClickViewAll = (e) => {
        e.preventDefault();
        history.push('./etfs');
    };

    // handle file upload
    const onFileUpload = async (e, file) => {
        e.preventDefault();
        const text = await file.text();
        const result = parse(text, { header: true });
        if (result.errors.length === 0) {
            const dataKeys = Object.keys(result.data[0]);
            const componentArray = result.data.map((row) => ({ _id: uuidv4(), symbol: row[dataKeys[0]], weight: row[dataKeys[1]] }));
            setComponents(componentArray);
        }
    };

    // onChange handler
    const onChange = useCallback((e, componentId) => {
        const value = e.target.value;
        const field = e.target.name;
        setComponents((currComponents) => currComponents.map((component) => (component._id === componentId ? { ...component, [field]: value } : component)));
    }, []);

    // onBlur validate symbol
    const validateFields = async (field, componentId, componentArray = components, updateStatus = true, setFormState = true) => {
        let error = false;
        let component = componentArray.find((component) => component._id === componentId);

        switch (field) {
            case 'symbol':
                component = { ...component, symbol: component.symbol.toUpperCase() }; // make symbol uppercase
                error = await validateFormSymbol(component, components, error, updateStatus, setStatusMessage);
                break;
            case 'weight':
                if (weightType !== 'market') error = await validateFormWeight(component, error, updateStatus, setStatusMessage);
                break;
            default:
                break;
        }

        field = field.charAt(0).toUpperCase() + field.slice(1);
        component = { ...component, [`error${field}`]: error };
        if (setFormState) {
            setComponents((currComponents) => currComponents.map((componentItem) => (componentItem._id === componentId ? component : componentItem)));
            return error;
        }
        return [error, component];
    };

    // validate weight total
    const validateWeight = () => {
        let total = 0;
        components.map((component) => (total += component.weight === '' || isNaN(component.weight) ? 0 : parseFloat(component.weight)));
        return total !== 100 ? true : false;
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        setStatusMessage({ message: `validating form`, type: 'text-info' });

        // validate form before submitting
        let isFormValid = true;
        let validField = true;
        let componentArray = components;

        for (let i = 0; i < componentArray.length; i++) {
            let component = componentArray[i];
            for (let j = 0; j < fieldList.length; j++) {
                [validField, component] = await validateFields(fieldList[j], component._id, componentArray, false, false);
                // eslint-disable-next-line
                componentArray = componentArray.map((componentItem) => (componentItem._id === component._id ? component : componentItem));
                isFormValid = isFormValid && !validField;
            }
        }

        setComponents(componentArray);

        // verify weights total to 100% if not market weight
        if (weightType !== 'market') isFormValid = isFormValid && !validateWeight();

        if (isFormValid) {
            // console.log('valid form');
            setStatusMessage({ message: `valid form`, type: 'text-success' });
            addOrUpdateComponents(_id, symbol, components, history);
        } else {
            setStatusMessage({ message: `errors exits, database not updated`, type: 'text-danger' });
        }
    };

    return (
        <Hotkeys keyName='shift+alt+a' onKeyDown={(keyName, e, handle) => onClickAdd(e)}>
            <div className='col-sm-12 col-md-10 col-lg-8 m-auto pt-3'>
                <h4 className='text-center'>{`${symbol} Components`}</h4>
                <form className='dynamicForm card-shadow'>
                    <div className='buttonWrapper'>
                        <FormButton click={onClickAdd} innerHtml={<i className='fas fa-plus'></i>} buttonText='Add Component' classModifier=' ghost_button' />
                        <div>
                            <FormButton click={onClickViewAll} innerHtml={<i className='fa fa-list-alt mr-2'></i>} buttonText='View All' classModifier='btn btn-secondary mr-2 rounded' />
                            <FormButton click={onSubmit} innerHtml={<i className='fa fa-database mr-2'></i>} buttonText='Submit' classModifier='btn btn-primary mr-3 rounded' buttonDisabled={components.length === 0 ? true : false} />
                        </div>
                    </div>

                    {components.length === 0 ? (
                        <div className='uploadWrapper'>
                            <EtfUpload onSubmit={onFileUpload} />
                        </div>
                    ) : (
                        <div className='fieldWrapper large'>
                            {components.map((component, index) => {
                                return (
                                    <FormGroup
                                        onChange={onChange}
                                        onBlur={validateFields}
                                        buttonClick={onClickRemove}
                                        buttonDisabled={components.length === 1 ? true : false}
                                        weightDisabled={weightType === 'market' ? true : false}
                                        component={component}
                                        index={index}
                                        key={component._id}
                                    />
                                );
                            })}
                        </div>
                    )}
                </form>
                <div className='messageBar'>
                    <h6 className={`small text-success text-left pt-3 ${statusMessage !== '' && statusMessage.type}`}>{statusMessage !== '' && statusMessage.message}</h6>
                    <h6 className='small text-danger text-right pt-3'>{errorMessage !== '' && errorMessage}</h6>
                </div>
            </div>
        </Hotkeys>
    );
};

const FormButton = ({ click, innerHtml, buttonText, classModifier, buttonDisabled }) => (
    <button className={`${classModifier}`} onClick={click} disabled={buttonDisabled}>
        {innerHtml} {buttonText}
    </button>
);

const FormGroup = ({ onChange, onBlur, buttonClick, buttonDisabled, weightDisabled, component, index }) => {
    // destructure component
    const { _id, symbol, weight, errorSymbol, errorWeight } = component;

    return (
        <div className='dynamicForm__row'>
            <div className='dynamicForm__index'>
                <span>{index + 1}</span>
            </div>
            <div className='col px-1 '>
                <input type='text' name='symbol' className={`form-control ${errorSymbol ? 'inputError' : ''}`} placeholder='Symbol' value={symbol} onChange={(e) => onChange(e, _id)} onBlur={async (e) => await onBlur(e.target.name, _id)} />
            </div>
            <div className='col px-1'>
                <input
                    type='text'
                    name='weight'
                    className={`form-control weightInput ${errorWeight ? 'inputError' : ''}`}
                    placeholder='Weight [%]'
                    value={weight}
                    onChange={(e) => onChange(e, _id)}
                    onBlur={async (e) => await onBlur(e.target.name, _id)}
                    disabled={weightDisabled}
                />
            </div>
            <div className='dynamicForm__dismiss pl-1'>
                <button className='dismiss__button' type='button' onClick={() => buttonClick(_id)} disabled={false} tabIndex='-1'>
                    <i className='fas fa-times'></i>
                </button>
            </div>
        </div>
    );
};

EtfComponents.propTypes = {
    addOrUpdateComponents: PropTypes.func.isRequired,
    validateSymbol: PropTypes.func.isRequired,
    current: PropTypes.object.isRequired,
};

const mapStatetoProps = (state) => ({
    current: state.etf.current,
});

export default connect(mapStatetoProps, { addOrUpdateComponents, validateSymbol })(EtfComponents);

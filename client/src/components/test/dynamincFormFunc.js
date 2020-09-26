// https://codepen.io/bertdida/pen/EOdYxG

import React, { useState } from 'react';
import Hotkeys from 'react-hot-keys';

const DynamincFormFunc = () => {
    // local state
    const [fields, setFields] = useState(['', '', '']);

    // add new field
    const onClickAdd = (e) => {
        e.preventDefault();
        setFields([...fields, '']);
    };

    // remove field
    const onClickRemove = (index) => {
        setFields(fields.filter((field, i) => i !== index));
    };

    // onChange value
    const onChange = (index, e) => {
        let newFields = [...fields];
        newFields[index] = e.target.value;
        setFields(newFields);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        alert(fields);
    };

    return (
        <Hotkeys keyName='shift+alt+a' onKeyDown={(keyName, e, handle) => onClickAdd(e)}>
            <form className='dynamicForm'>
                <div className='dynamicForm__buttonWrapper'>
                    <FormButton click={onClickAdd} innerHtml='Add Field' type='ghost' classModifier='dynamicForm__button--isGhost' />
                    <FormButton click={onSubmit} innerHtml='Submit' />
                </div>

                {fields.map((value, index) => {
                    return (
                        <FormGroup
                            onChange={onChange}
                            buttonClick={onClickRemove}
                            buttonDisabled={index === 0 ? fields.length === 1 : undefined}
                            value={value}
                            index={index}
                            key={index}
                        />
                    );
                })}
            </form>
        </Hotkeys>
    );
};

const FormButton = ({ click, innerHtml, classModifier }) => (
    <button className={`dynamicForm__button ${classModifier}`} onClick={click}>
        {innerHtml}
    </button>
);

const FormGroup = ({ onChange, buttonClick, buttonDisabled, value, index }) => {
    return (
        <div className='dynamicForm__item'>
            <input className='dynamicForm__itemInput' type='text' value={value} onChange={(e) => onChange(index, e)} />
            <button className='dynamicForm__itemButton' type='button' onClick={() => buttonClick(index)} disabled={buttonDisabled} tabIndex='-1' />
        </div>
    );
};
export default DynamincFormFunc;

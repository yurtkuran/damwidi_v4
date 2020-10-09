import React from 'react';
// import './dynamicForm.min.css';

class DynamicForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { fields: ['', '', ''] };
        this.onClickButtonAdder = this.onClickButtonAdder.bind(this);
        this.onClickButtonSubmit = this.onClickButtonSubmit.bind(this);
    }

    onClickButtonAdder(event) {
        event.preventDefault();
        this.setState({
            fields: ['', ...this.state.fields],
        });
    }

    onClickFormGroupButton(index) {
        console.log(index);
        let fields = [...this.state.fields];
        fields.splice(index, 1);
        this.setState({ fields });
    }

    onChangeFormGroupInput(index, event) {
        let fields = [...this.state.fields];
        fields[index] = event.target.value;
        this.setState({ fields });
    }

    onClickButtonSubmit(event) {
        event.preventDefault();
        const filteredValues = this.state.fields.filter((value) => value);
        alert(filteredValues);
    }

    render() {
        const isFormGroupDeletionAllowed = this.state.fields.length > 1 ? true : false;

        return (
            <form className='dynamicForm'>
                <div className='dynamicForm__buttonWrapper'>
                    <FormButton click={this.onClickButtonAdder} innerHtml='Add Field' type='ghost' classModifier='dynamicForm__button--isGhost' />
                    <FormButton click={this.onClickButtonSubmit} innerHtml='Submit' />
                </div>

                {this.state.fields.map((value, index) => (
                    <FormGroup
                        inputChange={this.onChangeFormGroupInput.bind(this, index)}
                        buttonClick={this.onClickFormGroupButton.bind(this, index)}
                        buttonDisabled={index === 0 ? !isFormGroupDeletionAllowed : undefined}
                        value={value}
                        key={index}
                    />
                ))}
            </form>
        );
    }
}

const FormButton = ({ click, innerHtml, classModifier }) => (
    <button className={`dynamicForm__button ${classModifier}`} onClick={click}>
        {innerHtml}
    </button>
);

const FormGroup = ({ inputChange, buttonClick, buttonDisabled, value }) => (
    <div className='dynamicForm__item'>
        <input className='dynamicForm__itemInput' type='text' value={value} onChange={inputChange} />
        <button className='dynamicForm__itemButton' type='button' onClick={buttonClick} disabled={buttonDisabled} tabIndex='-1' />
    </div>
);

export default DynamicForm;

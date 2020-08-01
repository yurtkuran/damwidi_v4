import passwordValidator from 'password-validator';

// configure password-validator
const schema = new passwordValidator();

// password properties
schema
    .is().min(8)                                    // minimum length 8
    .is().max(24)                                   // maximum length 24
    .has().uppercase()                              // must have uppercase letters
    .has().lowercase()                              // must have lowercase letters
    .has().digits()                                 // must have digits
    .has().symbols()                                // must have symbols
    .has().not().spaces()                           // should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // blacklist these values

const validatePassword = (password) => {
    return schema.validate(password)
};

export default validatePassword;
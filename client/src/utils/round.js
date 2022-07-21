// function to round to 'n' digits
const round = (num, digits) => {
    const precision = Math.pow(10, digits);
    return Math.round((num + Number.EPSILON) * precision) / precision;
};

// calculate gain from two prices
const gain = (current, basis) => {
    return round((100 * (parseFloat(current) - parseFloat(basis))) / parseFloat(basis), 2);
};

module.exports = {
    round,
    gain,
};

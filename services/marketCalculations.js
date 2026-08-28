const phpRound = (value, precision) => {
    const multiplier = 10 ** precision;
    const sign = value < 0 ? -1 : 1;

    return (sign * Math.round((Math.abs(value) + Number.EPSILON) * multiplier)) / multiplier;
};

const calculateGainFactor = (current, previous, precision = 6) => {
    const gain = (Number(current) - Number(previous)) / Number(previous);
    return phpRound(1 + gain, precision);
};

module.exports = {
    calculateGainFactor,
    phpRound,
};

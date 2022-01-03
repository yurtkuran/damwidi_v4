const formattedDate = (d) => {
    return `${d.getFullYear()}.${d.getMonth() < 10 ? 0 : ''}${d.getMonth()}.${d.getDate() < 10 ? 0 : ''}${d.getDate()}`;
};

const formattedTime = (t) => {
    return `${t.getHours() < 10 ? '0' : ''}${t.getHours()}:${t.getMinutes() < 10 ? '0' : ''}${t.getMinutes()}:${t.getSeconds() < 10 ? '0' : ''}${t.getSeconds()}`;
};

const logTime = () => {
    const datetime = new Date();
    return `[${formattedDate(datetime)}:${formattedTime(datetime)}]`;
};

module.exports = {
    formattedDate,
    formattedTime,
    logTime,
};

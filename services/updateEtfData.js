// database models
const Stock = require('../models/Stock');

// loop through ETF holdings when ETF symbol changes
const updateComponentOf = async (etf, newSymbol) => {
    // destructure
    const { symbol: prevSymbol, holdings } = etf;

    // console.log(`New ETF symbol: ${newSymbol}, Previous ETF Symbol ${prevSymbol}`);
    for (component of holdings) {
        // destructure
        const { symbol, stock: stockId } = component;

        // find stock in database
        stock = await Stock.findById(stockId);
        let { componentOf } = stock;

        // replace etf symbol in componentOf array
        if (componentOf.includes(prevSymbol)) stock.componentOf = componentOf.map((etf) => (etf === prevSymbol ? newSymbol : etf));
        stock.save();
    }
    return true;
};

// remove ETF from componentOf listing with stock is removed from ETF holdings
const reviseComponentOf = async (etf, removeAll = false) => {
    // destructure
    const { symbol: etfSymbol, holdings } = etf;

    try {
        // find stocks that are components of ETF
        stocks = await Stock.find({ componentOf: etfSymbol });
        // console.log(stocks);

        for (stock of stocks) {
            // destructure
            const { symbol, componentOf } = stock;

            if (holdings.find((holding) => holding.symbol === symbol) === undefined || removeAll) {
                // stock is not a holding of this ETF, remove ETF from componenOf array
                stock.componentOf = componentOf.filter((etf) => etf !== etfSymbol);
                stock.save();
                // console.log(symbol);
            }
        }
    } catch (err) {
        console.error(err.message);
    }
};

module.exports = {
    updateComponentOf,
    reviseComponentOf,
};

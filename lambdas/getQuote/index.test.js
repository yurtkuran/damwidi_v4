const assert = require('assert');
const { createHandler } = require('./index');

const parseBody = (response) => JSON.parse(response.body);

const testValidQuote = async () => {
    const calls = [];
    let timestamp = 1000;
    const handler = createHandler(
        {
            async get(url, options) {
                calls.push({ url, options });
                return {
                    status: 200,
                    data: {
                        chart: {
                            result: [
                                {
                                    meta: {
                                        symbol: 'AAPL',
                                        regularMarketPrice: 275.25,
                                        chartPreviousClose: 272.5,
                                        regularMarketTime: 1793456789,
                                    },
                                },
                            ],
                        },
                    },
                };
            },
        },
        () => {
            timestamp += 25;
            return timestamp;
        }
    );

    const response = await handler({ pathParameters: { symbol: ' aapl ' } });
    const body = parseBody(response);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].url, 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL');
    assert.deepStrictEqual(calls[0].options.params, { interval: '1m', range: '1d' });
    assert.strictEqual(calls[0].options.timeout, 10000);
    assert.strictEqual(body.symbol, 'AAPL');
    assert.strictEqual(body.regularMarketPrice, 275.25);
    assert.strictEqual(body.regularMarketPreviousClose, 272.5);
    assert.strictEqual(body.previousClose, 272.5);
    assert.strictEqual(body.regularMarketTime, 1793456789);
    assert.strictEqual(body.executionTime, 25);
};

const testMissingSymbol = async () => {
    const handler = createHandler({
        async get() {
            throw new Error('HTTP client should not be called');
        },
    });
    const response = await handler({ pathParameters: {} });

    assert.strictEqual(response.statusCode, 404);
    assert.deepStrictEqual(parseBody(response), { message: 'symbol not provided' });
};

const testUnavailableQuote = async () => {
    const handler = createHandler({
        async get() {
            return {
                status: 200,
                data: { chart: { result: null, error: { description: 'Not Found' } } },
            };
        },
    });
    const response = await handler({ pathParameters: { symbol: 'INVALID' } });
    const body = parseBody(response);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(body.symbol, 'INVALID');
    assert.strictEqual(body.status, 500);
    assert.strictEqual(body.message, 'Quote retrieval failed');
    assert.strictEqual(body.errorMessage, 'Yahoo quote did not include a current market price');
};

(async () => {
    await testValidQuote();
    await testMissingSymbol();
    await testUnavailableQuote();
    console.log('getQuote Lambda tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

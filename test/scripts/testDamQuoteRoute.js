const assert = require('assert');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../../config/db').DB_MySQL;
const marketDataRouter = require('../../routes/marketData');

const request = async (url, token) => {
    const headers = token ? { 'x-auth-token': token } : {};
    const response = await fetch(url, { headers });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    return { body, status: response.status };
};

(async () => {
    const app = express();
    app.use('/api/marketData', marketDataRouter);
    const server = app.listen(0, '127.0.0.1');
    let databaseClosed = false;

    try {
        await new Promise((resolve) => server.once('listening', resolve));

        const baseURL = `http://127.0.0.1:${server.address().port}/api/marketData/quote/DAM`;
        const missing = await request(baseURL);
        const invalid = await request(baseURL, 'invalid-token');
        const unverified = await request(
            baseURL,
            jwt.sign({ user: { isVerified: false } }, process.env.SECRET)
        );
        const verified = await request(
            baseURL,
            jwt.sign({ user: { isVerified: true } }, process.env.SECRET)
        );

        assert.deepStrictEqual(missing, {
            status: 401,
            body: { msg: 'no token, authorization denied' },
        });
        assert.deepStrictEqual(invalid, {
            status: 401,
            body: { msg: 'invalid token' },
        });
        assert.deepStrictEqual(unverified, {
            status: 401,
            body: { msg: 'permission denied - not verified' },
        });
        assert.strictEqual(verified.status, 200);
        assert.deepStrictEqual(Object.keys(verified.body), [
            'symbol',
            'latestPrice',
            'change',
            'changePercent',
            'previousClose',
        ]);

        await db.close();
        databaseClosed = true;
        const databaseFailure = await request(
            baseURL,
            jwt.sign({ user: { isVerified: true } }, process.env.SECRET)
        );
        assert.deepStrictEqual(databaseFailure, {
            status: 500,
            body: 'server error',
        });

        console.log({
            authentication: {
                missing: missing.status,
                invalid: invalid.status,
                unverified: unverified.status,
                verified: verified.status,
            },
            databaseFailure: databaseFailure.status,
            quote: verified.body,
        });
    } finally {
        await new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
        if (!databaseClosed) {
            await db.close();
        }
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

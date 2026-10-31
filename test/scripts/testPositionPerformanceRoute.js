const assert = require('assert');
const express = require('express');
const jwt = require('jsonwebtoken');

const db = require('../../config/db').DB_MySQL;
const damwidiRouter = require('../../routes/damwidi');

const request = async (url, token) => {
    const headers = token ? { 'x-auth-token': token } : {};
    const response = await fetch(url, { headers });
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    return { body, status: response.status };
};

(async () => {
    const app = express();
    app.use('/api/damwidi', damwidiRouter);
    const server = app.listen(0, '127.0.0.1');
    let databaseClosed = false;

    try {
        await new Promise((resolve) => server.once('listening', resolve));

        const route = `http://127.0.0.1:${server.address().port}/api/damwidi/positionPerformance`;
        const missing = await request(`${route}/AMZN`);
        const invalidToken = await request(`${route}/AMZN`, 'invalid-token');
        const nonMember = await request(
            `${route}/AMZN`,
            jwt.sign({ user: { isMember: false } }, process.env.SECRET)
        );
        const memberToken = jwt.sign({ user: { isMember: true } }, process.env.SECRET);
        const invalidSymbol = await request(`${route}/TOO-LONG`, memberToken);
        const missingPosition = await request(`${route}/ZZZZZ`, memberToken);
        const member = await request(`${route}/AMZN`, memberToken);

        assert.deepStrictEqual(missing, {
            status: 401,
            body: { msg: 'no token, authorization denied' },
        });
        assert.deepStrictEqual(invalidToken, {
            status: 401,
            body: { msg: 'invalid token' },
        });
        assert.deepStrictEqual(nonMember, {
            status: 401,
            body: { msg: 'permission denied - not member' },
        });
        assert.strictEqual(invalidSymbol.status, 400);
        assert.deepStrictEqual(missingPosition, {
            status: 404,
            body: { msg: 'position not found' },
        });
        assert.strictEqual(member.status, 200);
        assert.deepStrictEqual(Object.keys(member.body), [
            'symbol',
            'priceLast',
            'pricePreviousClose',
            'purchases',
        ]);

        await db.close();
        databaseClosed = true;
        const databaseFailure = await request(`${route}/AMZN`, memberToken);
        assert.deepStrictEqual(databaseFailure, {
            status: 500,
            body: 'server error',
        });

        console.log({
            authentication: {
                missing: missing.status,
                invalid: invalidToken.status,
                nonMember: nonMember.status,
                member: member.status,
            },
            validation: invalidSymbol.status,
            missingPosition: missingPosition.status,
            databaseFailure: databaseFailure.status,
            purchaseCount: member.body.purchases.length,
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

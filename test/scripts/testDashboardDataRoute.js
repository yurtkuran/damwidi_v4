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
        const url = `http://127.0.0.1:${server.address().port}/api/damwidi/dashboardData`;
        const missing = await request(url);
        const invalid = await request(url, 'invalid-token');
        const nonMember = await request(url, jwt.sign({ user: { isMember: false } }, process.env.SECRET));
        const member = await request(url, jwt.sign({ user: { isMember: true } }, process.env.SECRET));

        assert.deepStrictEqual(missing, { status: 401, body: { msg: 'no token, authorization denied' } });
        assert.deepStrictEqual(invalid, { status: 401, body: { msg: 'invalid token' } });
        assert.strictEqual(nonMember.status, 200);
        assert.deepStrictEqual(nonMember.body.positions, []);
        assert.strictEqual(member.status, 200);
        assert.ok(member.body.positions.length > 0);
        assert.deepStrictEqual(Object.keys(member.body), [
            'asOf',
            'fundQuote',
            'indexQuotes',
            'movers',
            'allocationSummary',
            'positions',
            'dataQuality',
        ]);

        await db.close();
        databaseClosed = true;
        const databaseFailure = await request(url, jwt.sign({ user: { isMember: true } }, process.env.SECRET));
        assert.deepStrictEqual(databaseFailure, { status: 500, body: 'server error' });

        console.log({
            authentication: { missing: missing.status, invalid: invalid.status, nonMember: nonMember.status, member: member.status },
            roleProjection: { nonMemberPositions: nonMember.body.positions.length, memberPositions: member.body.positions.length },
            databaseFailure: databaseFailure.status,
        });
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
        if (!databaseClosed) await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

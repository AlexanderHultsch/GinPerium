'use strict';

const express = require('express');
const path = require('node:path');

const { createRepository } = require('./db/repository');
const { attachUser } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorEnvelope');
const { createAuthRouter } = require('./routes/auth');
const { createGinsRouter } = require('./routes/gins');
const { createAdminRouter } = require('./routes/admin');

function createApp(db) {
    const repo = createRepository(db);
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', true);

    app.use(express.json());
    app.use(attachUser(repo));

    app.use('/api/auth', createAuthRouter(repo));
    app.use('/api/gins', createGinsRouter(repo));
    app.use('/api/admin', createAdminRouter(repo));

    app.use('/api', notFoundHandler);

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(errorHandler);

    return app;
}

module.exports = { createApp };

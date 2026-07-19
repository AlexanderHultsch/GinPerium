'use strict';

class HttpError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

function notFoundHandler(req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nicht gefunden.' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    const message = status >= 500 ? 'Es ist ein unerwarteter Fehler aufgetreten.' : err.message;

    if (status >= 500) {
        console.error(err);
    }

    res.status(status).json({ error: { code, message } });
}

module.exports = { HttpError, notFoundHandler, errorHandler };

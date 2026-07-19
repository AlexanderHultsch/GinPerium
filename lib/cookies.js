'use strict';

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) {
        return cookies;
    }

    for (const part of cookieHeader.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) {
            continue;
        }
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (key) {
            cookies[key] = decodeURIComponent(value);
        }
    }

    return cookies;
}

function serializeCookie(name, value, options = {}) {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.maxAgeMs !== undefined) {
        cookie += `; Max-Age=${Math.floor(options.maxAgeMs / 1000)}`;
    }
    cookie += `; Path=${options.path ?? '/'}`;
    if (options.httpOnly !== false) {
        cookie += '; HttpOnly';
    }
    cookie += `; SameSite=${options.sameSite ?? 'Lax'}`;
    if (options.secure) {
        cookie += '; Secure';
    }

    return cookie;
}

module.exports = { parseCookies, serializeCookie };

'use strict';

const crypto = require('node:crypto');

const getPantryRoute = (ctx) => {
  if (ctx.path === '/api/pantry-items-owner') {
    return ctx.method === 'GET' ? ctx.path : null;
  }

  if (ctx.path === '/api/pantry-items/bulk') {
    return ctx.method === 'POST' ? ctx.path : null;
  }

  if (ctx.path === '/api/pantry-items/bulk-delete') {
    return ctx.method === 'POST' ? ctx.path : null;
  }

  if (ctx.path.startsWith('/api/pantry-items/owned/')) {
    return ['PUT', 'DELETE'].includes(ctx.method)
      ? '/api/pantry-items/owned/:id'
      : null;
  }

  return null;
};

module.exports = ({ strapi }) => {
  return async (ctx, next) => {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    const route = getPantryRoute(ctx);
    if (!route) {
      return next();
    }

    const startedAt = performance.now();
    const requestId =
      ctx.request.headers['x-essora-request-id'] || crypto.randomUUID();

    if (!ctx.request.headers['x-essora-request-id']) {
      ctx.request.headers['x-essora-request-id'] = requestId;
    }

    try {
      await next();
    } finally {
      try {
        strapi.log.info(
          `[pantry.lifecycle] requestId=${requestId} method=${ctx.method} ` +
            `route=${route} status=${ctx.status || 'unknown'} ` +
            `server=${Math.round(performance.now() - startedAt)}ms`
        );
      } catch {
        // Diagnostic logging must not change the request outcome.
      }
    }
  };
};

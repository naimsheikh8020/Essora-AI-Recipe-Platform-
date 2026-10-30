'use strict';

const PANTRY_PATHS = new Set([
  '/api/pantry-items-owner',
  '/api/pantry-items/bulk',
  '/api/pantry-items/bulk-delete',
]);

const isPantryRequest = (path) =>
  PANTRY_PATHS.has(path) ||
  path.startsWith('/api/pantry-items/owned/');

module.exports = ({ strapi }) => {
  return async (ctx, next) => {
    if (process.env.NODE_ENV !== 'development' || !isPantryRequest(ctx.path)) {
      return next();
    }

    const startedAt = performance.now();
    const requestId = ctx.request.headers['x-essora-request-id'] || 'missing';

    try {
      await next();
    } finally {
      try {
        strapi.log.info(
          `[pantry.http] requestId=${requestId} method=${ctx.method} ` +
            `path=${ctx.path} status=${ctx.status} ` +
            `server=${Math.round(performance.now() - startedAt)}ms`
        );
      } catch {
        // Diagnostic logging must not change the request outcome.
      }
    }
  };
};

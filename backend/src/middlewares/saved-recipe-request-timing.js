'use strict';

module.exports = ({ strapi } = {}) => {
  return async (ctx, next) => {
    if (
      process.env.NODE_ENV !== 'development' ||
      ctx.path !== '/api/saved-recipes'
    ) {
      return next();
    }

    const startedAt = performance.now();

    try {
      await next();
    } finally {
      const message =
        `[saved-recipe.http] method=${ctx.method} path=${ctx.path} ` +
        `status=${ctx.status || 'unknown'} ` +
        `server=${Math.round(performance.now() - startedAt)}ms`;

      try {
        if (strapi?.log?.info) {
          strapi.log.info(message);
        } else {
          console.info(message);
        }
      } catch {
        // Timing diagnostics must never change the request outcome.
      }
    }
  };
};

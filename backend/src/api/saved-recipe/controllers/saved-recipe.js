'use strict';

/**
 * saved-recipe controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::saved-recipe.saved-recipe',
  ({ strapi } = {}) => {
    const logTiming = (operation, ctx, startedAt) => {
      const message =
        `[saved-recipe.${operation}] method=${ctx.method} path=${ctx.path} ` +
        `status=${ctx.status || "unknown"} ` +
        `total=${Math.round(performance.now() - startedAt)}ms`;

      try {
        if (strapi?.log?.info) {
          strapi.log.info(message);
        } else {
          console.info(message);
        }
      } catch {
        // Diagnostics must never alter the API response.
      }
    };

    return {
      async create(ctx) {
        const startedAt = performance.now();

        try {
          return await super.create(ctx);
        } finally {
          logTiming("create", ctx, startedAt);
        }
      },
      async find(ctx) {
        const startedAt = performance.now();

        try {
          return await super.find(ctx);
        } finally {
          logTiming("find", ctx, startedAt);
        }
      },
    };
  }
);

'use strict';

/**
 * saved-recipe controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::saved-recipe.saved-recipe',
  ({ strapi } = {}) => {
    const logTiming = (operation, ctx, startedAt, details = {}) => {
      const message =
        `[saved-recipe.${operation}] method=${ctx.method} path=${ctx.path} ` +
        `status=${ctx.status || "unknown"} ` +
        `total=${Math.round(performance.now() - startedAt)}ms ` +
        Object.entries(details)
          .map(([key, value]) => `${key}=${value}ms`)
          .join(' ');

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
      async save(ctx) {
        const startedAt = performance.now();
        const requestData = ctx.request.body?.data || {};
        const userId = Number(requestData.userId);
        const recipeDocumentId = String(
          requestData.recipeDocumentId || ''
        ).trim();

        if (!Number.isInteger(userId) || !recipeDocumentId) {
          return ctx.badRequest('A valid user and recipe are required.');
        }

        try {
          const queryStartedAt = performance.now();
          const existing = await strapi.db
            .query('api::saved-recipe.saved-recipe')
            .findOne({
              where: {
                user: { id: userId },
                recipe: { documentId: recipeDocumentId },
              },
              select: ['id', 'documentId'],
            });
          const duplicateQueryMs = Math.round(
            performance.now() - queryStartedAt
          );

          if (existing) {
            ctx.body = {
              data: { alreadySaved: true, documentId: existing.documentId },
            };
            return;
          }

          const createStartedAt = performance.now();
          const savedRecipe = await strapi.documents(
            'api::saved-recipe.saved-recipe'
          ).create({
            data: {
              user: userId,
              recipe: { connect: [recipeDocumentId] },
              saveAt: new Date().toISOString(),
            },
            fields: ['id', 'documentId'],
          });
          const createMs = Math.round(performance.now() - createStartedAt);

          ctx.body = {
            data: {
              id: savedRecipe.id,
              documentId: savedRecipe.documentId,
              alreadySaved: false,
            },
          };

          logTiming('save', ctx, startedAt, {
            duplicateQueryMs,
            createMs,
            responseSerializationMs: Math.round(
              performance.now() - createStartedAt - createMs
            ),
          });
        } catch (error) {
          if (error?.name === 'ApplicationError') {
            return ctx.badRequest(error.message);
          }
          throw error;
        }
      },
      async remove(ctx) {
        const startedAt = performance.now();
        const requestData = ctx.request.body?.data || {};
        const userId = Number(requestData.userId);
        const recipeDocumentId = String(
          requestData.recipeDocumentId || ''
        ).trim();

        if (!Number.isInteger(userId) || !recipeDocumentId) {
          return ctx.badRequest('A valid user and recipe are required.');
        }

        const lookupStartedAt = performance.now();
        const existing = await strapi.db
          .query('api::saved-recipe.saved-recipe')
          .findOne({
            where: {
              user: { id: userId },
              recipe: { documentId: recipeDocumentId },
            },
            select: ['id', 'documentId'],
          });
        const lookupMs = Math.round(performance.now() - lookupStartedAt);

        if (!existing) {
          ctx.body = { data: { removed: false } };
          logTiming('remove', ctx, startedAt, { lookupMs });
          return;
        }

        const deleteStartedAt = performance.now();
        await strapi.documents('api::saved-recipe.saved-recipe').delete({
          documentId: existing.documentId,
        });
        const deleteMs = Math.round(performance.now() - deleteStartedAt);

        ctx.body = { data: { removed: true } };
        logTiming('remove', ctx, startedAt, {
          lookupMs,
          deleteMs,
          responseSerializationMs: Math.round(
            performance.now() - deleteStartedAt - deleteMs
          ),
        });
      },
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

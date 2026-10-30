'use strict';

/**
 * pantry-item controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const MAX_BULK_ITEMS = 50;

module.exports = createCoreController('api::pantry-item.pantry-item', ({ strapi }) => ({
  async bulkCreate(ctx) {
    const startedAt = performance.now();
    const body = ctx.request.body || {};
    const { ownerId, ingredients } = body;

    if (!Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
      return ctx.badRequest('A valid owner is required');
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return ctx.badRequest('Ingredients must be a non-empty array');
    }

    if (ingredients.length > MAX_BULK_ITEMS) {
      return ctx.badRequest(`A maximum of ${MAX_BULK_ITEMS} ingredients can be saved at once`);
    }

    const normalizedIngredients = [];
    const seenNames = new Set();

    for (const ingredient of ingredients) {
      if (!ingredient || typeof ingredient !== 'object') {
        return ctx.badRequest('Each ingredient must be an object');
      }

      const name = typeof ingredient.name === 'string' ? ingredient.name.trim() : '';
      const quantity =
        typeof ingredient.quantity === 'string' ? ingredient.quantity.trim() : '';

      if (!name || name.length > 200 || quantity.length > 100) {
        return ctx.badRequest('Each ingredient must have a valid name and quantity');
      }

      const duplicateKey = name.toLocaleLowerCase();
      if (seenNames.has(duplicateKey)) {
        return ctx.badRequest(`Duplicate ingredient: ${name}`);
      }

      seenNames.add(duplicateKey);
      normalizedIngredients.push({ name, quantity, imageUrl: '', owner: Number(ownerId) });
    }

    const userLookupStartedAt = performance.now();
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: Number(ownerId) },
      select: ['id'],
    });
    const userLookupDuration = performance.now() - userLookupStartedAt;

    if (!user) {
      return ctx.badRequest('Owner does not exist');
    }

    const databaseStartedAt = performance.now();
    const result = await strapi.db.transaction(async ({ trx }) =>
      strapi.db.query('api::pantry-item.pantry-item').createMany({
        data: normalizedIngredients,
        transacting: trx,
      })
    );
    const databaseDuration = performance.now() - databaseStartedAt;

    if (process.env.NODE_ENV === 'development') {
      strapi.log.info(
        `[pantry.bulkCreate] total=${Math.round(performance.now() - startedAt)}ms ` +
          `userLookup=${Math.round(userLookupDuration)}ms ` +
          `database=${Math.round(databaseDuration)}ms items=${normalizedIngredients.length}`
      );
    }

    ctx.body = {
      data: {
        count: result.count,
        ids: result.ids,
      },
    };
  },

  async bulkDelete(ctx) {
    const body = ctx.request.body || {};
    const { ownerId, itemIds } = body;

    if (!Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
      return ctx.badRequest('A valid owner is required');
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return ctx.badRequest('Item IDs must be a non-empty array');
    }

    if (itemIds.length > MAX_BULK_ITEMS) {
      return ctx.badRequest(`A maximum of ${MAX_BULK_ITEMS} items can be deleted at once`);
    }

    const normalizedItemIds = itemIds.filter(
      (itemId) =>
        (typeof itemId === 'string' && itemId.trim().length > 0) ||
        (Number.isInteger(itemId) && itemId > 0)
    );

    if (normalizedItemIds.length !== itemIds.length) {
      return ctx.badRequest('Each item ID must be a non-empty string');
    }

    const documentIds = normalizedItemIds.filter((itemId) => typeof itemId === 'string');
    const numericIds = normalizedItemIds.filter((itemId) => Number.isInteger(itemId));
    const identifierFilters = [];

    if (documentIds.length > 0) {
      identifierFilters.push({ documentId: { $in: documentIds } });
    }

    if (numericIds.length > 0) {
      identifierFilters.push({ id: { $in: numericIds } });
    }

    const result = await strapi.db.transaction(async ({ trx }) =>
      strapi.db.query('api::pantry-item.pantry-item').deleteMany({
        where: {
          $or: identifierFilters,
          owner: { id: Number(ownerId) },
        },
        transacting: trx,
      })
    );

    ctx.body = {
      data: {
        count: result.count,
      },
    };
  },
}));

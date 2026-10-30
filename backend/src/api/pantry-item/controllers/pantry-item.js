'use strict';

/**
 * pantry-item controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const MAX_BULK_ITEMS = 50;

const getRequestId = (ctx) =>
  ctx.request.headers['x-essora-request-id'] || 'missing';

const logDevelopment = (strapi, message) => {
  if (process.env.NODE_ENV !== 'development') return;
  try {
    strapi.log.info(message);
  } catch {
    // Diagnostics must never affect a successful request.
  }
};

const getOwnerId = (ownerId) =>
  Number.isInteger(Number(ownerId)) && Number(ownerId) > 0
    ? Number(ownerId)
    : null;

const getItemIdentifierFilter = (itemId) => {
  const filters = [{ documentId: itemId }];
  if (Number.isInteger(Number(itemId)) && Number(itemId) > 0) {
    filters.push({ id: Number(itemId) });
  }
  return { $or: filters };
};

module.exports = createCoreController('api::pantry-item.pantry-item', ({ strapi }) => ({
  async listOwned(ctx) {
    const startedAt = performance.now();
    const requestId = getRequestId(ctx);
    const requestedOwnerId = ctx.query.ownerId;
    const clerkId = typeof ctx.query.clerkId === 'string'
      ? ctx.query.clerkId.trim()
      : '';
    let ownerId = getOwnerId(requestedOwnerId);

    if (!ownerId && clerkId) {
      const owner = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { clerkId }, select: ['id'] });
      ownerId = owner?.id || null;
    }

    if (!ownerId) {
      return ctx.unauthorized('Authentication required');
    }

    const queryStartedAt = performance.now();
    const rows = await strapi.db
      .getConnection()
      .from('pantry_items as pantry')
      .innerJoin(
        'pantry_items_owner_lnk as ownerLink',
        'ownerLink.pantry_item_id',
        'pantry.id'
      )
      .innerJoin('up_users as owner', 'owner.id', 'ownerLink.user_id')
      .where((query) => {
        query.where('ownerLink.user_id', ownerId);
      })
      .select([
        'pantry.name',
        'pantry.quantity',
        'pantry.image_url as imageUrl',
        'pantry.created_at as createdAt',
        'pantry.document_id as documentId',
      ])
      .orderBy('pantry.created_at', 'desc');
    const queryDuration = performance.now() - queryStartedAt;

    ctx.body = { data: rows };
    logDevelopment(
      strapi,
      `[pantry.listOwned] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
        `query=${Math.round(queryDuration)}ms ` +
        `mapping=0ms ownerMode=explicitOwner returned=${rows.length}`
    );
  },

  async bulkCreate(ctx) {
    const startedAt = performance.now();
    const requestId = getRequestId(ctx);
    const body = ctx.request.body || {};
    const ownerId = getOwnerId(body.ownerId);
    const { ingredients } = body;

    if (!ownerId) return ctx.badRequest('A valid ownerId is required');

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
      normalizedIngredients.push({ name, quantity, imageUrl: '' });
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

    const pantryUid = 'api::pantry-item.pantry-item';
    const pantryQuery = strapi.db.query(pantryUid);
    const createStartedAt = performance.now();
    let createdIds = [];
    let baseCreateDuration = 0;
    let relationInsertDuration = 0;
    let cleanupDuration = 0;
    let cleanupCount = 0;
    const cleanupCreatedItems = async (reason) => {
      if (createdIds.length === 0) return;
      const cleanupStartedAt = performance.now();
      try {
        await pantryQuery.deleteMany({ where: { id: { $in: createdIds } } });
        cleanupCount += 1;
      } catch (cleanupError) {
        strapi.log.error(
          `[pantry.bulkCreate] requestId=${requestId} cleanup failed reason=${reason} ` +
            `itemCount=${createdIds.length}: ${cleanupError.message}`
        );
      } finally {
        cleanupDuration += performance.now() - cleanupStartedAt;
      }
    };

    try {
      const baseCreateStartedAt = performance.now();
      const created = await pantryQuery.createMany({
        data: normalizedIngredients,
      });
      baseCreateDuration = performance.now() - baseCreateStartedAt;
      createdIds = created.ids;

      const ownerAttribute = strapi.db.metadata.get(pantryUid).attributes.owner;
      const { joinTable } = ownerAttribute;
      const { joinColumn, inverseJoinColumn } = joinTable;
      const relationRows = createdIds.map((id) => ({
        [joinColumn.name]: id,
        [inverseJoinColumn.name]: Number(ownerId),
      }));

      const relationInsertStartedAt = performance.now();
      await strapi.db.transaction(async ({ trx }) => {
        await strapi.db.entityManager.insertJoinTableRows(
          joinTable.name,
          relationRows,
          trx
        );
      });
      relationInsertDuration = performance.now() - relationInsertStartedAt;
    } catch (error) {
      await cleanupCreatedItems('create');
      throw error;
    }

    const reloadStartedAt = performance.now();
    let savedItems;
    let reloadRows;
    try {
      reloadRows = await strapi.db
        .getConnection()
        .from('pantry_items as pantry')
        .innerJoin(
          'pantry_items_owner_lnk as ownerLink',
          'ownerLink.pantry_item_id',
          'pantry.id'
        )
        .innerJoin('up_users as owner', 'owner.id', 'ownerLink.user_id')
        .whereIn('pantry.id', createdIds)
        .andWhere('ownerLink.user_id', Number(ownerId))
        .select([
          'pantry.id',
          'pantry.name',
          'pantry.quantity',
          'pantry.image_url as imageUrl',
          'pantry.created_at as createdAt',
          'pantry.document_id as documentId',
          'owner.id as ownerId',
          'owner.document_id as ownerDocumentId',
        ])
        .orderBy('pantry.created_at', 'desc');
    } catch (error) {
      await cleanupCreatedItems('reload');
      throw error;
    }
    const reloadDuration = performance.now() - reloadStartedAt;

    const mappingStartedAt = performance.now();
    savedItems = reloadRows.map((row) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      documentId: row.documentId,
      owner: {
        id: row.ownerId,
        documentId: row.ownerDocumentId,
      },
    }));
    const mappingDuration = performance.now() - mappingStartedAt;

    const verificationStartedAt = performance.now();
    const ownerIds = savedItems.map((item) => item.owner?.id);
    const allItemsLinkedToOwner =
      savedItems.length === normalizedIngredients.length &&
      ownerIds.length === normalizedIngredients.length &&
      ownerIds.every((id) => id === Number(ownerId));

    if (!allItemsLinkedToOwner) {
      await cleanupCreatedItems('ownership');
      throw new Error('Pantry items were created without the expected owner relation');
    }
    const verificationDuration = performance.now() - verificationStartedAt;

    logDevelopment(
      strapi,
        `[pantry.bulkCreate] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `userLookup=${Math.round(userLookupDuration)}ms ` +
          `itemCount=${normalizedIngredients.length} ` +
          `create=${Math.round(performance.now() - createStartedAt)}ms ` +
          `baseCreate=${Math.round(baseCreateDuration)}ms ` +
          `relationInsert=${Math.round(relationInsertDuration)}ms ` +
          `reload=${Math.round(reloadDuration)}ms mapping=${Math.round(mappingDuration)}ms ` +
          `verification=${Math.round(verificationDuration)}ms ` +
          `cleanup=${Math.round(cleanupDuration)}ms cleanupCount=${cleanupCount} ` +
          `verified=${savedItems.length}`
    );

    ctx.body = {
      data: {
        count: savedItems.length,
        ids: createdIds,
        items: savedItems,
      },
    };
  },

  async bulkDelete(ctx) {
    const startedAt = performance.now();
    const requestId = getRequestId(ctx);
    const body = ctx.request.body || {};
    const ownerId = getOwnerId(body.ownerId);
    const { itemIds } = body;

    if (!ownerId) return ctx.badRequest('A valid ownerId is required');

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

    const deleteStartedAt = performance.now();
    const result = await strapi.db
      .query('api::pantry-item.pantry-item')
      .deleteMany({
        where: {
          $or: identifierFilters,
          owner: { id: Number(ownerId) },
        },
      });

    logDevelopment(
      strapi,
        `[pantry.bulkDelete] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
          `delete=${Math.round(performance.now() - deleteStartedAt)}ms ` +
          `itemCount=${normalizedItemIds.length} deleted=${result.count}`
    );

    ctx.body = {
      data: {
        count: result.count,
      },
    };
  },

  async updateOwned(ctx) {
    const ownerId = getOwnerId(ctx.query.ownerId);
    const itemId = ctx.params.id;
    const { name, quantity } = ctx.request.body || {};

    if (!ownerId) {
      return ctx.badRequest('A valid ownerId is required');
    }

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 200 ||
      typeof quantity !== 'string' ||
      quantity.trim().length > 100
    ) {
      return ctx.badRequest('Name and quantity are required');
    }

    const pantryQuery = strapi.db.query('api::pantry-item.pantry-item');
    const item = await pantryQuery.findOne({
      where: {
        ...getItemIdentifierFilter(itemId),
        owner: { id: ownerId },
      },
    });

    if (!item) {
      return ctx.notFound('Pantry item not found');
    }

    const updatedItem = await pantryQuery.update({
      where: { id: item.id },
      data: { name: name.trim(), quantity: quantity.trim() },
    });

    ctx.body = { data: updatedItem };
  },

  async deleteOwned(ctx) {
    const startedAt = performance.now();
    const requestId = getRequestId(ctx);
    const ownerId = getOwnerId(ctx.query.ownerId);
    const itemId = ctx.params.id;

    if (!ownerId) {
      return ctx.badRequest('A valid ownerId is required');
    }

    const deleteStartedAt = performance.now();
    const result = await strapi.db
      .query('api::pantry-item.pantry-item')
    .deleteMany({
      where: {
        ...getItemIdentifierFilter(itemId),
        owner: { id: ownerId },
      },
    });

    if (result.count !== 1) {
    return ctx.notFound('Pantry item not found');
    }

    logDevelopment(
      strapi,
      `[pantry.deleteOwned] requestId=${requestId} total=${Math.round(performance.now() - startedAt)}ms ` +
        `delete=${Math.round(performance.now() - deleteStartedAt)}ms ` +
        `itemCount=1`
    );

    ctx.body = {
    data: {
      id: Number.isInteger(Number(itemId)) ? Number(itemId) : itemId,
    },
    };
  },
}));

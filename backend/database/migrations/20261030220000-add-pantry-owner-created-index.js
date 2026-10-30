'use strict';

module.exports = {
  async up(knex) {
    if (
      (await knex.schema.hasTable('pantry_items_owner_lnk')) &&
      (await knex.schema.hasColumn('pantry_items_owner_lnk', 'user_id')) &&
      (await knex.schema.hasColumn('pantry_items_owner_lnk', 'pantry_item_id'))
    ) {
      await knex.schema.alterTable('pantry_items_owner_lnk', (table) => {
        table.index(
          ['user_id', 'pantry_item_id'],
          'pantry_items_owner_user_item_idx'
        );
      });
    }

    if (
      (await knex.schema.hasTable('pantry_items')) &&
      (await knex.schema.hasColumn('pantry_items', 'created_at'))
    ) {
      await knex.schema.alterTable('pantry_items', (table) => {
        table.index(['created_at'], 'pantry_items_created_at_idx');
      });
    }

  },

  async down(knex) {
    if (await knex.schema.hasTable('pantry_items_owner_lnk')) {
      await knex.schema.alterTable('pantry_items_owner_lnk', (table) => {
        table.dropIndex(
          ['user_id', 'pantry_item_id'],
          'pantry_items_owner_user_item_idx'
        );
      });
    }

    if (await knex.schema.hasTable('pantry_items')) {
      await knex.schema.alterTable('pantry_items', (table) => {
        table.dropIndex(['created_at'], 'pantry_items_created_at_idx');
      });
    }

  },
};

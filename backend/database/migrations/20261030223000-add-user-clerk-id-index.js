'use strict';

module.exports = {
  async up(knex) {
    if (
      (await knex.schema.hasTable('up_users')) &&
      (await knex.schema.hasColumn('up_users', 'clerk_id'))
    ) {
      await knex.schema.alterTable('up_users', (table) => {
        table.index(['clerk_id'], 'up_users_clerk_id_idx');
      });
    }
  },

  async down(knex) {
    if (await knex.schema.hasTable('up_users')) {
      await knex.schema.alterTable('up_users', (table) => {
        table.dropIndex(['clerk_id'], 'up_users_clerk_id_idx');
      });
    }
  },
};

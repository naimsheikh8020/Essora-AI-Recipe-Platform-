'use strict';

module.exports = {
  async up(knex) {
    if (
      (await knex.schema.hasTable('recipes')) &&
      !(await knex.schema.hasColumn('recipes', 'pantry_fingerprint'))
    ) {
      await knex.schema.alterTable('recipes', (table) => {
        table.string('pantry_fingerprint', 64);
      });
    }
  },

  async down(knex) {
    if (
      (await knex.schema.hasTable('recipes')) &&
      (await knex.schema.hasColumn('recipes', 'pantry_fingerprint'))
    ) {
      await knex.schema.alterTable('recipes', (table) => {
        table.dropColumn('pantry_fingerprint');
      });
    }
  },
};

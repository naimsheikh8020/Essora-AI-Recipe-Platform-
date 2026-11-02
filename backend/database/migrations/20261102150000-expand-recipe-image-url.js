'use strict';

module.exports = {
  async up(knex) {
    if (
      (await knex.schema.hasTable('recipes')) &&
      (await knex.schema.hasColumn('recipes', 'image_url'))
    ) {
      await knex.schema.alterTable('recipes', (table) => {
        table.text('image_url').alter();
      });
    }
  },

  async down(knex) {
    if (
      !(await knex.schema.hasTable('recipes')) ||
      !(await knex.schema.hasColumn('recipes', 'image_url'))
    ) {
      return;
    }

    const [{ maxLength }] = await knex('recipes').max({
      maxLength: knex.raw('char_length(??)', ['image_url']),
    });

    if (Number(maxLength) > 255) {
      throw new Error(
        'Cannot revert recipes.image_url to varchar(255): existing URLs exceed 255 characters'
      );
    }

    await knex.schema.alterTable('recipes', (table) => {
      table.string('image_url', 255).alter();
    });
  },
};

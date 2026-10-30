'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/pantry-items-owner',
      handler: 'pantry-item.listOwned',
    },
    {
      method: 'POST',
      path: '/pantry-items/bulk',
      handler: 'pantry-item.bulkCreate',
    },
    {
      method: 'POST',
      path: '/pantry-items/bulk-delete',
      handler: 'pantry-item.bulkDelete',
      config: {
        auth: {
          scope: ['api::pantry-item.pantry-item.bulkDelete'],
        },
      },
    },
    {
      method: 'PUT',
      path: '/pantry-items/owned/:id',
      handler: 'pantry-item.updateOwned',
    },
    {
      method: 'DELETE',
      path: '/pantry-items/owned/:id',
      handler: 'pantry-item.deleteOwned',
    },
  ],
};

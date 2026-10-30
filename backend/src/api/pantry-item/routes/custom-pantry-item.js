'use strict';

module.exports = {
  routes: [
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
  ],
};

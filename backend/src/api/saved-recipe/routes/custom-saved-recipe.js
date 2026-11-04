'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/saved-recipes/save',
      handler: 'api::saved-recipe.saved-recipe.save',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/saved-recipes/remove',
      handler: 'api::saved-recipe.saved-recipe.remove',
      config: { auth: false },
    },
  ],
};

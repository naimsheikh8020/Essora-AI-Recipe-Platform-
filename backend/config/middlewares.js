module.exports = [
  {
    name: 'global::pantry-lifecycle-timing',
  },
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::saved-recipe-request-timing',
  },
  {
    name: 'global::pantry-request-timing',
  },
];

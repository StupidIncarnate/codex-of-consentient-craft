/**
 * PURPOSE: Defines all supported routing library types for the project structure
 *
 * USAGE:
 * import {routingLibraryStatics} from './routing-library-statics';
 * const libraries = routingLibraryStatics.libraries.all;
 * // Returns readonly array of all valid routing library names
 */

export const routingLibraryStatics = {
  libraries: {
    all: [
      // Frontend routers
      'react-router-dom',
      'vue-router',
      '@angular/router',

      // Backend frameworks (act as routers)
      'express',
      'fastify',
      'koa',
      'hapi',
    ] as const,
  },
} as const;

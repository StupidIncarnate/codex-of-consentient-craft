import { routingLibraryStatics } from './routing-library-statics';

describe('routingLibraryStatics', () => {
  it('VALID: libraries.all => contains expected routing libraries', () => {
    const { libraries } = routingLibraryStatics;

    expect(libraries.all).toStrictEqual([
      'react-router-dom',
      'vue-router',
      '@angular/router',
      'express',
      'fastify',
      'koa',
      'hapi',
    ]);
  });

  it('VALID: libraries.all => is readonly', () => {
    const { libraries } = routingLibraryStatics;

    expect(Object.isFrozen(libraries.all)).toBe(true);
  });
});

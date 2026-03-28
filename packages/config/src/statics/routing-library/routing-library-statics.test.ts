import { routingLibraryStatics } from './routing-library-statics';

describe('routingLibraryStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(routingLibraryStatics).toStrictEqual({
      libraries: {
        all: [
          'react-router-dom',
          'vue-router',
          '@angular/router',
          'express',
          'fastify',
          'koa',
          'hapi',
        ],
      },
    });
  });
});

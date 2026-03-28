import { frameworkStatics } from './framework-statics';

describe('frameworkStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(frameworkStatics).toStrictEqual({
      frameworks: {
        all: [
          'react',
          'vue',
          'angular',
          'svelte',
          'solid',
          'preact',
          'express',
          'fastify',
          'koa',
          'hapi',
          'nestjs',
          'nextjs',
          'nuxtjs',
          'remix',
          'node-library',
          'react-library',
          'cli',
          'ink-cli',
          'monorepo',
        ],
      },
    });
  });
});

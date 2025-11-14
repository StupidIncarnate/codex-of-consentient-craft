import { frameworkStatics } from './framework-statics';

describe('frameworkStatics', () => {
  it('VALID: frameworks.all => contains expected frameworks', () => {
    const { frameworks } = frameworkStatics;

    expect(frameworks.all).toStrictEqual([
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
    ]);
  });

  it('VALID: frameworks.all => is readonly', () => {
    const { frameworks } = frameworkStatics;

    expect(Object.isFrozen(frameworks.all)).toBe(true);
  });
});

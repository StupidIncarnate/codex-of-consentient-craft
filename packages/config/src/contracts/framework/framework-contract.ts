import { isInReadonlyArray } from '../is-in-readonly-array/is-in-readonly-array';

export const ALL_FRAMEWORKS = [
  // Frontend frameworks (implies widgets/, bindings/, frontend responders)
  'react',
  'vue',
  'angular',
  'svelte',
  'solid',
  'preact',

  // Backend frameworks (implies no widgets/, backend responders)
  'express',
  'fastify',
  'koa',
  'hapi',
  'nestjs',

  // Fullstack
  'nextjs',
  'nuxtjs',
  'remix',

  // Libraries/Tools
  'node-library', // No flows/, pure Node.js library
  'react-library', // Component library with widgets/
  'cli', // CLI tool with startup/
  'ink-cli', // React-based terminal UI with Ink

  // Monorepo
  'monorepo', // Root of monorepo, packages have their own frameworks
] as const;

export type Framework = (typeof ALL_FRAMEWORKS)[number];

export const isValidFramework = (framework: unknown): framework is Framework =>
  isInReadonlyArray({ value: framework, array: ALL_FRAMEWORKS });

export type Framework =
  // Frontend frameworks (implies widgets/, bindings/, frontend responders)
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'solid'
  | 'preact'

  // Backend frameworks (implies no widgets/, backend responders)
  | 'express'
  | 'fastify'
  | 'koa'
  | 'hapi'
  | 'nestjs'

  // Fullstack
  | 'nextjs'
  | 'nuxtjs'
  | 'remix'

  // Libraries/Tools
  | 'node-library' // No flows/, pure Node.js library
  | 'react-library' // Component library with widgets/
  | 'cli' // CLI tool with startup/
  | 'ink-cli' // React-based terminal UI with Ink

  // Monorepo
  | 'monorepo'; // Root of monorepo, packages have their own frameworks

export const ALL_FRAMEWORKS: readonly Framework[] = [
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
] as const;

export const isValidFramework = (framework: unknown): framework is Framework =>
  typeof framework === 'string' && ALL_FRAMEWORKS.includes(framework as Framework);

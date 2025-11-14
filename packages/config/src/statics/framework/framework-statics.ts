/**
 * PURPOSE: Defines all supported framework types for the project structure
 *
 * USAGE:
 * import {frameworkStatics} from './framework-statics';
 * const frameworks = frameworkStatics.frameworks.all;
 * // Returns readonly array of all valid framework names
 */

export const frameworkStatics = {
  frameworks: {
    all: [
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
    ] as const,
  },
} as const;

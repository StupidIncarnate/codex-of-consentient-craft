/**
 * PURPOSE: Defines required devDependencies for dungeonmaster projects
 *
 * USAGE:
 * devDependenciesStatics.packages['typescript'];
 * // Returns '^5.8.3' version string
 */

export const devDependenciesStatics = {
  // A consumer that takes dungeonmaster from a local checkout declares every `@dungeonmaster/*`
  // entry as `file:<path>`; a `*` beside those resolves to the registry, where no `@dungeonmaster`
  // package is published, and every later `npm install` in that repo 404s.
  localSpecifier: {
    scope: '@dungeonmaster/',
    prefix: 'file:',
  },
  packages: {
    '@dungeonmaster/eslint-plugin': '*',
    '@dungeonmaster/hooks': '*',
    '@dungeonmaster/mcp': '*',
    // Nothing else in the dependency graph a real `npm install @dungeonmaster/cli` pulls in
    // resolves this package — confirmed against a real scratch-consumer install (item G25): without
    // it, `@dungeonmaster/siegelense` never lands in a consumer's `node_modules`, so
    // `packageDiscoverBroker` never finds its `start-install.js`, and its install step (the
    // `.dungeonmaster-assets/siegelense-assets` link, the `.gitignore` entry, and the scaffolded
    // `packages/hydration-recipes/`) never runs for any real consumer.
    '@dungeonmaster/siegelense': '*',
    '@dungeonmaster/shared': '*',
    '@dungeonmaster/testing': '*',
    '@dungeonmaster/ward': '*',
    '@eslint/compat': '^1.3.1',
    '@eslint/eslintrc': '^3.3.1',
    '@playwright/test': '^1.58.2',
    '@types/debug': '^4.1.12',
    '@types/eslint': '^9.0.0',
    '@types/jest': '^30.0.0',
    '@types/node': '^24.0.15',
    '@types/prettier': '^2.7.3',
    '@typescript-eslint/eslint-plugin': '^8.35.1',
    '@typescript-eslint/parser': '^8.35.1',
    eslint: '^9.36.0',
    'eslint-config-prettier': '^10.1.5',
    'eslint-plugin-eslint-comments': '^3.2.0',
    'eslint-plugin-jest': '^29.0.1',
    'eslint-plugin-prettier': '^5.5.1',
    jest: '^30.0.4',
    prettier: '^3.6.2',
    'ts-jest': '^29.4.0',
    // No `ts-node`. The `eslint.config.js` this CLI scaffolds is plain JavaScript requiring the
    // PUBLISHED `@dungeonmaster/eslint-plugin`, which is compiled output, so a consumer project
    // loads no TypeScript at eslint time and needs no loader for it. `tsx` below covers what does
    // need one — a dev server, a script run straight from source.
    tsx: '^4.0.0',
    typescript: '^5.8.3',
  },
} as const;

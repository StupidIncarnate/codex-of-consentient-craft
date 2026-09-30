/**
 * PURPOSE: Every fixed value the npm-gateway sync reads — where dungeonmaster's own npm gateway is
 * found and where the consumer's lives, which package.json field it reads (`dependencies` only: a
 * devDependency is tooling, never imported by shipped code), which dependencies never get a gateway folder, and
 * the one `npm install` the sync runs to bring the lockfile back in step. `dropped` holds names that
 * are never wrapped: `@types/*` carry types only, and `dungeonmaster` / `@dungeonmaster/*` are the
 * tool itself, which a consumer never imports through its own gateway. `ownPackages` is the subset
 * of those a copied wrapper may still import raw (a proxy's `@dungeonmaster/testing/register-mock`),
 * since `init` installs them at the consumer's root. `esmProbe.diagnosticCodes` are the TypeScript
 * errors that mean a CommonJS file cannot `require` what it imports: TS1479 for an `import` or
 * `export ... from`, TS1471 for `import x = require()`.
 *
 * USAGE:
 * gatewayNpmSyncStatics.ownGateway.specifier;
 * // Returns '@dungeonmaster/npm/package.json'
 */

export const gatewayNpmSyncStatics = {
  ownGateway: {
    specifier: '@dungeonmaster/npm/package.json',
    sourceDirectory: 'src',
  },
  consumerGateway: {
    packageDirectory: 'packages/@gateway/npm',
    sourceDirectory: 'src',
    packagesDirectory: 'packages',
    gatewayGroupDirectory: '@gateway',
  },
  packageJson: {
    fileName: 'package.json',
    nameKey: 'name',
    dependencyKeys: ['dependencies'],
    recordKey: 'dependencies',
  },
  dropped: {
    names: ['dungeonmaster'],
    prefixes: ['@types/', '@dungeonmaster/'],
  },
  ownPackages: {
    names: ['dungeonmaster'],
    prefixes: ['@dungeonmaster/'],
  },
  folders: {
    testSupport: 'gateway-test-support',
    subpathSeparator: '__',
  },
  sourceExtensions: ['.ts', '.tsx'],
  esmProbe: {
    diagnosticCodes: {
      importOfEsm: 1479,
      importEqualsOfEsm: 1471,
    },
  },
  lifecycle: {
    envName: 'npm_command',
    ciValue: 'ci',
  },
  lockfileInstall: {
    command: 'npm',
    args: ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
  },
} as const;

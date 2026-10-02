import { gatewayNpmSyncStatics } from './gateway-npm-sync-statics';

describe('gatewayNpmSyncStatics', () => {
  it('VALID: {} => holds every value the npm-gateway sync reads', () => {
    expect(gatewayNpmSyncStatics).toStrictEqual({
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
        dependencyKeys: ['dependencies', 'devDependencies'],
        recordKey: 'dependencies',
        devRecordKey: 'devDependencies',
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
      gatewayFileExportSuffixes: ['.proxy', '.stub'],
      compileGateSkippedSuffixes: ['.test.ts', '.test.tsx', '.proxy.ts', '.proxy.tsx'],
      skipDetailMaxLength: 240,
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
        errorLinePrefixes: ['npm error', 'npm ERR!'],
      },
    });
  });
});

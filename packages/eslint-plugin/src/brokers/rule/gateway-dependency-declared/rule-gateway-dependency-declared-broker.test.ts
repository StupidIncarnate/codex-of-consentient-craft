import { ruleGatewayDependencyDeclaredBroker } from './rule-gateway-dependency-declared-broker';
import { ruleGatewayDependencyDeclaredBrokerProxy } from './rule-gateway-dependency-declared-broker.proxy';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

// registerMock resets between every test RuleTester generates, so every package.json fixture this
// file's cases rely on is re-staged before each one — the same shape enforce-implementation-colocation's
// own RuleTester test uses for its file-system fixtures.
beforeEach(() => {
  const proxy = ruleGatewayDependencyDeclaredBrokerProxy();

  proxy.setupPackageJson({
    packageDir: '/repo/packages/valid-runtime',
    packageJson: {
      name: '@dungeonmaster/valid-runtime',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      dependencies: { '@dungeonmaster/npm': '*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/valid-test-devdep',
    packageJson: {
      name: '@dungeonmaster/valid-test-devdep',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      devDependencies: { '@dungeonmaster/npm': '*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/valid-conditions',
    packageJson: {
      name: '@dungeonmaster/valid-conditions',
      imports: { '#gateway/npm/*': { source: '@dungeonmaster/npm/*' } },
      dependencies: { '@dungeonmaster/npm': '*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/@gateway/npm',
    packageJson: {
      name: '@dungeonmaster/npm',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/invalid-runtime-devdep-only',
    packageJson: {
      name: '@dungeonmaster/invalid-runtime-devdep-only',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
      devDependencies: { '@dungeonmaster/npm': '*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/invalid-unmapped',
    packageJson: {
      name: '@dungeonmaster/invalid-unmapped',
      imports: {},
      dependencies: { '@dungeonmaster/npm': '*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/invalid-missing-dep',
    packageJson: {
      name: '@dungeonmaster/invalid-missing-dep',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
    },
  });

  proxy.setupPackageJson({
    packageDir: '/repo/packages/invalid-test-missing',
    packageJson: {
      name: '@dungeonmaster/invalid-test-missing',
      imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
    },
  });
});

ruleTester.run('gateway-dependency-declared', ruleGatewayDependencyDeclaredBroker(), {
  valid: [
    // --- mapped by "imports" and declared in "dependencies" ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/valid-runtime/src/brokers/x/x-broker.ts',
    },
    // --- test-support file: a devDependency alone satisfies the check ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/valid-test-devdep/src/brokers/x/x-broker.test.ts',
    },
    // --- a helper under the package's test/ folder is test support too ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/valid-test-devdep/test/type-fixtures/helper.ts',
    },
    // --- a conditions-object "imports" target resolves through its "source" condition ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/valid-conditions/src/brokers/x/x-broker.ts',
    },
    // --- self-import: a file inside packages/@gateway/npm importing its own gateway folder ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/@gateway/npm/src/glob-sync.ts',
    },
    // --- a non-"#gateway/" import is ignored entirely ---
    {
      code: "import { z } from 'zod';",
      filename: '/repo/packages/valid-runtime/src/brokers/x/x-broker.ts',
    },
  ],

  invalid: [
    // --- runtime file: a target declared only in devDependencies still fails ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/invalid-runtime-devdep-only/src/brokers/x/x-broker.ts',
      errors: [
        {
          messageId: 'missingDependency',
          data: {
            packageJsonPath: '/repo/packages/invalid-runtime-devdep-only/package.json',
            targetPackage: '@dungeonmaster/npm',
            specifier: '#gateway/npm/glob',
            location: 'dependencies',
          },
        },
      ],
    },
    // --- a src/ file is not test support, even with a test-ish name ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/invalid-runtime-devdep-only/src/test/helper.ts',
      errors: [
        {
          messageId: 'missingDependency',
          data: {
            packageJsonPath: '/repo/packages/invalid-runtime-devdep-only/package.json',
            targetPackage: '@dungeonmaster/npm',
            specifier: '#gateway/npm/glob',
            location: 'dependencies',
          },
        },
      ],
    },
    // --- the specifier itself has no matching "imports" key ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/invalid-unmapped/src/brokers/x/x-broker.ts',
      errors: [
        {
          messageId: 'unmappedSpecifier',
          data: {
            specifier: '#gateway/npm/glob',
            packageJsonPath: '/repo/packages/invalid-unmapped/package.json',
            folder: 'npm',
            scope: '@dungeonmaster',
          },
        },
      ],
    },
    // --- mapped, but the target package is declared nowhere ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/invalid-missing-dep/src/brokers/x/x-broker.ts',
      errors: [
        {
          messageId: 'missingDependency',
          data: {
            packageJsonPath: '/repo/packages/invalid-missing-dep/package.json',
            targetPackage: '@dungeonmaster/npm',
            specifier: '#gateway/npm/glob',
            location: 'dependencies',
          },
        },
      ],
    },
    // --- test-support file, missing from both maps: message offers either one ---
    {
      code: "import { glob } from '#gateway/npm/glob';",
      filename: '/repo/packages/invalid-test-missing/src/brokers/x/x-broker.test.ts',
      errors: [
        {
          messageId: 'missingDependency',
          data: {
            packageJsonPath: '/repo/packages/invalid-test-missing/package.json',
            targetPackage: '@dungeonmaster/npm',
            specifier: '#gateway/npm/glob',
            location: 'dependencies or devDependencies',
          },
        },
      ],
    },
  ],
});

/**
 * Pins which reads the unit-test I/O trap (`jest.setup-io-trap.js`) lets through when the code under
 * test calls into a TypeScript compiler.
 *
 * The trap is off inside an integration test, so each case here runs a REAL jest over a fixture
 * project whose setup loads this package's `src/jest.setup.js`, exactly as a consumer's jest does.
 * In each fixture an application file outside `node_modules` makes a `readFileSync` call, either
 * through a module sitting under a compiler package or on its own. The application file is the
 * frame the trap blames, so a passing fixture proves the compiler frame alone let the read through,
 * and the failing one proves the trap still catches application code.
 */

import { run } from '#gateway/node/child_process';
import { resolve } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';
import { installTestbedCreateBroker } from './brokers/install-testbed/create/install-testbed-create-broker';

const TESTING_ROOT = resolve(__dirname, '..');
const JEST_BIN = resolve(TESTING_ROOT, '../../node_modules/jest/bin/jest.js');

const FIXTURE_JEST_CONFIG = [
  `const testingRoot = ${JSON.stringify(TESTING_ROOT)};`,
  'module.exports = {',
  '  rootDir: __dirname,',
  "  testEnvironment: 'node',",
  "  setupFilesAfterEnv: [testingRoot + '/src/jest.setup.js'],",
  "  testMatch: ['<rootDir>/src/**/*.test.js'],",
  '  transform: {',
  "    '^.+\\\\.ts$': [",
  "      require.resolve('ts-jest', { paths: [testingRoot] }),",
  "      require(testingRoot + '/ts-jest/options.js'),",
  '    ],',
  '  },',
  '};',
].join('\n');

const COMPILER_MODULE_SOURCE = [
  "const fs = require('fs');",
  "module.exports = { readConfig: (path) => fs.readFileSync(path, 'utf8') };",
].join('\n');

const TSCONFIG_CONTENT = '{"compilerOptions":{"strict":true}}';

const FIXTURE_TEST_SOURCE = [
  "const { readAppConfig } = require('../packages/app/src/config-reader.js');",
  "it('VALID: {tsconfig.json} => reads it', () => {",
  `  expect(readAppConfig()).toBe(${JSON.stringify(TSCONFIG_CONTENT)});`,
  '});',
].join('\n');

describe('the unit-test I/O trap', () => {
  describe('a read made by a TypeScript compiler', () => {
    it('VALID: {readFileSync from node_modules/@ts-morph/common/, called by application code} => the fixture test passes', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'io-trap-ts-morph' });
      testbed.writeFile({ relativePath: 'jest.config.js', content: FIXTURE_JEST_CONFIG });
      testbed.writeFile({
        relativePath: 'node_modules/@ts-morph/common/dist/ts-morph-common.js',
        content: COMPILER_MODULE_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'packages/app/src/config-reader.js',
        content: [
          "const compiler = require('../../../node_modules/@ts-morph/common/dist/ts-morph-common.js');",
          "module.exports = { readAppConfig: () => compiler.readConfig(require('path').join(__dirname, '..', 'tsconfig.json')) };",
        ].join('\n'),
      });
      testbed.writeFile({ relativePath: 'packages/app/tsconfig.json', content: TSCONFIG_CONTENT });
      testbed.writeFile({
        relativePath: 'src/compiler-read.test.js',
        content: FIXTURE_TEST_SOURCE,
      });

      const result = await run({
        command: execPath,
        args: [JEST_BIN, '--config', `${testbed.guildPath}/jest.config.js`, '--ci'],
        cwd: testbed.guildPath,
      });
      testbed.cleanup();

      expect({
        exitCode: result.exitCode,
        trapLines: result.stderr
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('[io-trap]')),
      }).toStrictEqual({ exitCode: 0, trapLines: [] });
    });

    it('VALID: {readFileSync from node_modules/typescript/, called by application code} => the fixture test passes', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'io-trap-typescript' });
      testbed.writeFile({ relativePath: 'jest.config.js', content: FIXTURE_JEST_CONFIG });
      testbed.writeFile({
        relativePath: 'packages/app/node_modules/typescript/lib/typescript.js',
        content: COMPILER_MODULE_SOURCE,
      });
      testbed.writeFile({
        relativePath: 'packages/app/src/config-reader.js',
        content: [
          "const compiler = require('../node_modules/typescript/lib/typescript.js');",
          "module.exports = { readAppConfig: () => compiler.readConfig(require('path').join(__dirname, '..', 'tsconfig.json')) };",
        ].join('\n'),
      });
      testbed.writeFile({ relativePath: 'packages/app/tsconfig.json', content: TSCONFIG_CONTENT });
      testbed.writeFile({
        relativePath: 'src/compiler-read.test.js',
        content: FIXTURE_TEST_SOURCE,
      });

      const result = await run({
        command: execPath,
        args: [JEST_BIN, '--config', `${testbed.guildPath}/jest.config.js`, '--ci'],
        cwd: testbed.guildPath,
      });
      testbed.cleanup();

      expect({
        exitCode: result.exitCode,
        trapLines: result.stderr
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('[io-trap]')),
      }).toStrictEqual({ exitCode: 0, trapLines: [] });
    });
  });

  describe('a read made by application code itself', () => {
    it('ERROR: {readFileSync called directly by application code} => the fixture test fails on the trap', async () => {
      const testbed = installTestbedCreateBroker({ baseName: 'io-trap-application' });
      testbed.writeFile({ relativePath: 'jest.config.js', content: FIXTURE_JEST_CONFIG });
      testbed.writeFile({
        relativePath: 'packages/app/src/config-reader.js',
        content: [
          "const fs = require('fs');",
          "module.exports = { readAppConfig: () => fs.readFileSync(require('path').join(__dirname, '..', 'tsconfig.json'), 'utf8') };",
        ].join('\n'),
      });
      testbed.writeFile({ relativePath: 'packages/app/tsconfig.json', content: TSCONFIG_CONTENT });
      testbed.writeFile({
        relativePath: 'src/compiler-read.test.js',
        content: FIXTURE_TEST_SOURCE,
      });
      const trapLine =
        `[io-trap] unstaged fs.readFileSync("${testbed.guildPath}/packages/app/tsconfig.json") — ` +
        `stage it with registerMock in the calling file's proxy, using a recorded-failure stub for a real error`;

      const result = await run({
        command: execPath,
        args: [JEST_BIN, '--config', `${testbed.guildPath}/jest.config.js`, '--ci'],
        cwd: testbed.guildPath,
      });
      testbed.cleanup();

      expect({
        exitCode: result.exitCode,
        trapLines: result.stderr
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.startsWith('[io-trap]')),
      }).toStrictEqual({ exitCode: 1, trapLines: [trapLine, trapLine] });
    });
  });
});

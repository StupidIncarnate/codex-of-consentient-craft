/**
 * PURPOSE: Runs the `adapter-census` bin as a real child process against a directory,
 * for the integration tests. The child runs the TypeScript source under plain
 * `tsx --conditions=source`, so it needs no build.
 *
 * USAGE:
 * const census = adapterCensusHarness();
 * const result = census.runCensus({ args: ['--cwd=/tmp/fixture', '--format=json'] });
 * expect(result.exitCode).toBe(0);
 */
import * as path from '#gateway/node/path';
import { execFileSync } from '#gateway/node/child_process';

import type { InstallTestbed } from '@dungeonmaster/testing';
import { cwd } from '#gateway/node/process';

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ExecError {
  status: number;
  stdout?: { toString: () => string };
  stderr?: { toString: () => string };
}

const PACKAGE_DIR = cwd();
const ENTRY_PATH = path.join(cwd(), 'bin', 'adapter-census.ts');
const MAX_OUTPUT_BYTES = 512 * 1024 * 1024;
const TIMEOUT_MS = 300_000;

const isExecError = (error: unknown): error is ExecError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as Record<PropertyKey, unknown>).status === 'number';

export const adapterCensusHarness = (): {
  runCensus: (params: { args: readonly string[] }) => RunResult;
  installFixture: (params: { testbed: InstallTestbed }) => void;
  timeoutMs: number;
} => {
  const runCensus = ({ args }: { args: readonly string[] }): RunResult => {
    try {
      const stdout = execFileSync('npx', ['tsx', '--conditions=source', ENTRY_PATH, ...args], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: PACKAGE_DIR,
        maxBuffer: MAX_OUTPUT_BYTES,
      });
      return { exitCode: 0, stdout, stderr: '' };
    } catch (error) {
      if (!isExecError(error)) {
        throw error;
      }
      return {
        exitCode: error.status,
        stdout: error.stdout?.toString() ?? '',
        stderr: error.stderr?.toString() ?? '',
      };
    }
  };

  // A small workspace: `app` holds a pass-through adapter with a caller, a proxy chain and a
  // catch-all; `lib` holds an adapter with logic, reached through its package-root barrel; the node
  // gateway wraps `readFile`.
  const installFixture = ({ testbed }: { testbed: InstallTestbed }): void => {
    const files = {
      'package.json': JSON.stringify({
        name: '@acme/root',
        private: true,
        workspaces: ['packages/*', 'packages/@gateway/*'],
      }),
      'packages/app/package.json': JSON.stringify({ name: '@acme/app' }),
      'packages/lib/package.json': JSON.stringify({ name: '@acme/lib' }),
      'packages/@gateway/node/package.json': JSON.stringify({ name: '@acme/node' }),
      'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.ts': [
        "import { readFile } from 'fs/promises';",
        "export const fsReadFileAdapter = ({ path }: { path: string }) => readFile(path, 'utf8');",
      ].join('\n'),
      'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts': [
        "import { registerMock } from '@acme/testing/register-mock';",
        'export const fsReadFileAdapterProxy = () => {',
        '  registerMock({ fn: run }).calledWith([]).returns(1);',
        '  return {};',
        '};',
      ].join('\n'),
      'packages/app/src/adapters/fs/read-file/fs-read-file-adapter.test.ts':
        "import { fsReadFileAdapter } from './fs-read-file-adapter';",
      'packages/app/src/brokers/x/y/x-y-broker.ts': [
        "import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';",
        'export const xYBroker = () => fsReadFileAdapter({ path: "a" });',
      ].join('\n'),
      'packages/app/src/brokers/x/y/x-y-broker.proxy.ts': [
        "import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';",
        'export const xYBrokerProxy = () => fsReadFileAdapterProxy();',
      ].join('\n'),
      'packages/app/src/responders/r/z/r-z-responder.proxy.ts': [
        "import { xYBrokerProxy } from '../../../brokers/x/y/x-y-broker.proxy';",
        'export const RZResponderProxy = () => {',
        '  handle.onceFor([() => true]).returns(1);',
        '  return xYBrokerProxy();',
        '};',
      ].join('\n'),
      'packages/lib/src/adapters/net/check/net-check-adapter.ts': [
        "import { createServer } from 'net';",
        'export const netCheckAdapter = () => {',
        '  try {',
        '    return createServer();',
        '  } catch (error) {',
        '    throw error;',
        '  }',
        '};',
      ].join('\n'),
      'packages/lib/adapters.ts': "export * from './src/adapters/net/check/net-check-adapter';",
      'packages/app/src/brokers/z/w/z-w-broker.ts': [
        "import { netCheckAdapter } from '@acme/lib/adapters';",
        'export const zWBroker = () => netCheckAdapter();',
      ].join('\n'),
      'packages/@gateway/node/src/fs__promises/fs__promises.ts': [
        "export * from 'fs/promises';",
        "export { readFile } from './read-file/read-file';",
      ].join('\n'),
      'packages/@gateway/node/src/fs__promises/read-file/read-file.ts': [
        "import { readFile as read } from 'fs/promises';",
        "export const readFile = (path: string) => read(path, 'utf8');",
      ].join('\n'),
    };

    for (const [relativePath, content] of Object.entries(files)) {
      testbed.writeFile({
        relativePath,
        content,
      });
    }
  };

  return { runCensus, installFixture, timeoutMs: TIMEOUT_MS };
};

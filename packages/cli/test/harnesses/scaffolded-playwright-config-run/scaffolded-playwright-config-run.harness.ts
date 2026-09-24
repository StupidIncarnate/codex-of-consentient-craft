/**
 * PURPOSE: Spawns the real `tsx` binary against a scaffolded playwright.config.ts already written
 * to disk by StartInstall (inside an installTestbedCreateBroker temp dir), the same way
 * cliBinHarness spawns the CLI's own source entry — so `.dungeonmaster.json`, `__dirname` and
 * `process.env` are exactly what a consumer's own `npx playwright test` would see, with none of the
 * Jest-vm-sandbox mismatches an in-process `require()` of the same file hits (a jest test file is
 * itself already running inside one vm context, and executing more code through `vm.Script`/
 * `vm.compileFunction` from inside it resolves globals against a DIFFERENT context — measured: a
 * `process.env` write made from the test is invisible there, and a plain object literal built
 * inside compares unequal to one built outside). `installPlaywrightTestStub` writes a fake
 * `node_modules/@playwright/test` beside the config so the spawned process needs no real
 * Playwright install — its `defineConfig` returns its argument unchanged, exactly like Playwright's
 * own single-argument call does.
 *
 * USAGE:
 * const harness = scaffoldedPlaywrightConfigRunHarness();
 * harness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
 * const { exitCode, stdout, stderr } = await harness.run({
 *   configPath: `${testbed.guildPath}/playwright.config.ts`,
 *   cwd: testbed.guildPath,
 *   env: { DUNGEONMASTER_PORT: '4001' },
 * });
 * // stdout is the JSON-stringified argument defineConfig() was called with, when exitCode is 0
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { errorMessageContract, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const RUN_TIMEOUT_MS = 20_000;

export const scaffoldedPlaywrightConfigRunHarness = (): {
  installPlaywrightTestStub: (params: { dirPath: string }) => void;
  run: (params: { configPath: string; cwd: string; env: Record<string, string> }) => Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }>;
} => ({
  installPlaywrightTestStub: ({ dirPath }: { dirPath: string }): void => {
    const packageDir = join(dirPath, 'node_modules', '@playwright', 'test');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify({ name: '@playwright/test', version: '0.0.0', main: 'index.js' }),
    );
    writeFileSync(
      join(packageDir, 'index.js'),
      'module.exports = { defineConfig: (config) => config };\n',
    );
  },

  run: async ({
    configPath,
    cwd,
    env,
  }: {
    configPath: string;
    cwd: string;
    env: Record<string, string>;
  }): Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }> =>
    new Promise((promiseResolve, promiseReject) => {
      const evalCode =
        `const c = require(${JSON.stringify(configPath)}); ` +
        'process.stdout.write(JSON.stringify(c.default ?? c));';
      const child = spawn('npx', ['tsx', '-e', evalCode], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...env, FORCE_COLOR: '0' },
        cwd,
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';

      const timer = setTimeout(() => {
        child.kill();
        promiseReject(
          new Error(`scaffoldedPlaywrightConfigRunHarness.run timed out on ${configPath}`),
        );
      }, RUN_TIMEOUT_MS);

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        promiseResolve({
          exitCode: ExitCodeStub({ value: code ?? 1 }),
          stdout: errorMessageContract.parse(stdoutBuffer),
          stderr: errorMessageContract.parse(stderrBuffer),
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        promiseReject(err);
      });
    }),
});

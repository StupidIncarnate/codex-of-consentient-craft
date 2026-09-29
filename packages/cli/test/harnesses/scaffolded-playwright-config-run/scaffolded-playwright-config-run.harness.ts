/**
 * PURPOSE: Spawns the real `tsx` binary against a scaffolded playwright.config.ts already written
 * to disk by StartInstall (inside an installTestbedCreateBroker temp dir), the same way
 * cliBinHarness spawns the CLI's own source entry — so `.dungeonmaster.json`, `__dirname` and
 * `process.env` are exactly what a consumer's own `npx playwright test` would see, with none of the
 * Jest-vm-sandbox mismatches an in-process `require()` of the same file hits (a jest test file is
 * itself already running inside one vm context, and executing more code through `vm.Script`/
 * `vm.compileFunction` from inside it resolves globals against a DIFFERENT context — measured: a
 * `process.env` write made from the test is invisible there, and a plain object literal built
 * inside compares unequal to one built outside). `installGatewayNodeStub` writes a fake `node_modules/<scope>/node` beside the config,
 * named for the gateway package `StartInstall` scaffolded, so the config's `#gateway/node/{fs,path,
 * process}` imports resolve through the `imports` map `init` wrote without any workspace being
 * linked or built.
 *
 * USAGE:
 * const harness = scaffoldedPlaywrightConfigRunHarness();
 * harness.installGatewayNodeStub({ dirPath: testbed.guildPath });
 * const { exitCode, stdout, stderr } = await harness.run({
 *   configPath: `${testbed.guildPath}/playwright.config.ts`,
 *   cwd: testbed.guildPath,
 *   env: { DUNGEONMASTER_PORT: '4001' },
 * });
 * // stdout is the JSON-stringified default export of the config, when exitCode is 0
 */

import { spawnPiped } from '#gateway/node/child_process';
import { clearTimeout } from '#gateway/node/clearTimeout';
import { ensureDirSync, readJsonFileSync, writeFileSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { envSnapshot, execPath } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import { tsxCliPath } from '#gateway/npm/tsx';
import {
  errorMessageContract,
  ExitCodeStub,
  packageJsonContract,
} from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

const RUN_TIMEOUT_MS = 20_000;

export const scaffoldedPlaywrightConfigRunHarness = (): {
  installGatewayNodeStub: (params: { dirPath: string }) => void;
  run: (params: { configPath: string; cwd: string; env: Record<string, string> }) => Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }>;
} => ({
  installGatewayNodeStub: ({ dirPath }: { dirPath: string }): void => {
    const gatewayNodePackageJson = packageJsonContract.parse(
      readJsonFileSync(join(dirPath, 'packages', '@gateway', 'node', 'package.json')),
    );
    const packageDir = join(
      dirPath,
      'node_modules',
      ...String(gatewayNodePackageJson.name).split('/'),
    );
    // A testbed's config sits beside its ROOT package.json, which `init` never gives an `imports`
    // map (only the packages under packages/* get one), so the harness adds the one entry the
    // config needs.
    const rootPackageJsonPath = join(dirPath, 'package.json');
    writeFileSync(
      rootPackageJsonPath,
      JSON.stringify({
        ...packageJsonContract.parse(readJsonFileSync(rootPackageJsonPath)),
        imports: {
          '#gateway/node/*': `${String(gatewayNodePackageJson.name).split('/')[0]}/node/*`,
        },
      }),
    );
    ensureDirSync(packageDir);
    writeFileSync(
      join(packageDir, 'package.json'),
      JSON.stringify({
        name: gatewayNodePackageJson.name,
        version: '0.0.0',
        exports: { './fs': './fs.js', './path': './path.js', './process': './process.js' },
      }),
    );
    writeFileSync(
      join(packageDir, 'fs.js'),
      "const nodeFs = require('node:fs');\nmodule.exports = { readFileSync: (path) => nodeFs.readFileSync(path, 'utf8') };\n",
    );
    writeFileSync(join(packageDir, 'path.js'), "module.exports = require('node:path');\n");
    writeFileSync(
      join(packageDir, 'process.js'),
      'module.exports = { getEnv: (name) => process.env[name] };\n',
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
      // tsx's own CLI under this node, not `npx tsx`: npx adds its own startup to every run. The
      // spawn happens in this executor, before the promise is returned, so a caller can overlap
      // other work with the child.
      const child = spawnPiped({
        command: execPath,
        args: [tsxCliPath(), '-e', evalCode],
        cwd,
        env: { ...envSnapshot(), ...env, FORCE_COLOR: '0' },
      });
      child.endStdin();

      // Lines rejoined with the newline each lost; the config's JSON is one line and a config that
      // fails to load prints its message on stderr, so a stream reads back as written, plus a
      // closing newline where the child wrote none.
      const text = {
        stdout: errorMessageContract.parse(''),
        stderr: errorMessageContract.parse(''),
      };
      child.onStdoutLine((line) => {
        text.stdout = errorMessageContract.parse(`${text.stdout}${line}\n`);
      });
      child.onStderrLine((line) => {
        text.stderr = errorMessageContract.parse(`${text.stderr}${line}\n`);
      });

      const timer = setTimeout(() => {
        child.kill();
        promiseReject(
          new Error(`scaffoldedPlaywrightConfigRunHarness.run timed out on ${configPath}`),
        );
      }, RUN_TIMEOUT_MS);

      child.onExit(({ code, error }) => {
        clearTimeout(timer);
        if (error !== undefined) {
          promiseReject(error);
          return;
        }
        promiseResolve({
          exitCode: ExitCodeStub({ value: code ?? 1 }),
          stdout: text.stdout,
          stderr: text.stderr,
        });
      });
    }),
});

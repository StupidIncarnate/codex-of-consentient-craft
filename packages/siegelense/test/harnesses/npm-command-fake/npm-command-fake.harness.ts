/**
 * PURPOSE: Fakes `npm install` / `npm run build --workspace=<name>` for the one integration test
 * that would otherwise run `InstallRecipesScaffoldResponder`'s real npm calls (DEF-36) on every
 * fresh-scaffold case. `registerMock` cannot reach here — its AST hoisting only covers `.test.ts`
 * (unit) files, so a `registerMock({ fn: spawn })` call from an `.integration.test.ts` registers
 * too late and the real `child_process.spawn('npm', ...)` still runs, exactly like the real fake
 * Claude/ward CLIs elsewhere in this repo (`CLAUDE_CLI_PATH`, `WARD_CLI_PATH`): this fakes the
 * BINARY `npm` resolves to, not the `spawn` call itself, by putting a throwaway `npm` executable
 * (`bin/npm`, exits 0, does nothing) ahead of the real one on `PATH`. `npmInstallAdapter`/
 * `npmRunBuildAdapter` never override `env.PATH`, so the spawned child inherits whatever `PATH`
 * this process holds at spawn time.
 *
 * USAGE:
 * const npmFake = npmCommandFakeHarness();
 * // inside an it(): npmFake.stageSucceeds();
 * // afterEach restores the original PATH automatically
 */

import { resolve as resolvePath } from 'path';

const FAKE_NPM_BIN_DIR = resolvePath(__dirname, 'bin');

export const npmCommandFakeHarness = (): {
  stageSucceeds: () => void;
  afterEach: () => void;
} => {
  // Captured once, at harness construction — before any test's stageSucceeds() call could have
  // mutated it, so this is always the real, unmodified PATH afterEach restores.
  const originalPath = process.env.PATH ?? '';

  return {
    stageSucceeds: (): void => {
      process.env.PATH = `${FAKE_NPM_BIN_DIR}:${originalPath}`;
    },

    afterEach: (): void => {
      process.env.PATH = originalPath;
    },
  };
};

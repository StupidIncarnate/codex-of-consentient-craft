/**
 * PURPOSE: Fakes `npm install` / `npm run build --workspace=<name>` for the `dungeonmaster init`
 * integration tests that route through `CliFlow`/`StartCli` — the real install pipeline discovers
 * every package's compiled `dist/startup/start-install.js` (including
 * `@dungeonmaster/siegelense`'s, which scaffolds `packages/hydration-recipes` and then really runs
 * those two commands against the fresh testbed, DEF-36). `registerMock` cannot reach here — its AST
 * hoisting only covers `.test.ts` (unit) files, so a `registerMock({ fn: spawn })` call from an
 * `.integration.test.ts` registers too late and the real `child_process.spawn('npm', ...)` still
 * runs. This fakes the BINARY `npm` resolves to, not the `spawn` call itself, by putting a
 * throwaway `npm` executable (`bin/npm`, exits 0, does nothing) ahead of the real one on `PATH` —
 * mirrors `packages/siegelense/test/harnesses/npm-command-fake/` exactly, kept package-local
 * because a package's `test/` directory is not part of its public export surface.
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

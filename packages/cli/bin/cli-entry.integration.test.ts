/**
 * PURPOSE: Integration tests for the dungeonmaster CLI binary built from cli-entry
 *
 * USAGE:
 * npm test -- cli-entry.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { cliBinHarness } from '../test/harnesses/cli-bin/cli-bin.harness';

// Both child spawns share this budget now that they run together. The harness gives each its own
// internal kill timer — 5000ms for runInit, 3000ms for the import probe — so this only has to
// outlast the pair, leaving the harness's timers to be what resolves a hang.
const SPAWNS_TIMEOUT_MS = 20_000;

describe('dungeonmaster binary', () => {
  const harness = cliBinHarness();

  // Both spawns run HERE because what they cost is the RUNTIME's, not the assertions'. `runInit`
  // launches `npx tsx --conditions=source bin/cli-entry.ts`, and nearly all of its measured 3524ms
  // was that child compiling and loading the CLI's module graph before `init` did anything. jest
  // runs beforeAll outside the test_start..test_done window, so the boot lands in the suite's wall
  // time — which ward already reports as `durationMs` — and each test measures its own assertion.
  let init: Awaited<ReturnType<typeof harness.runInit>>;
  let importProbe: Awaited<ReturnType<typeof harness.requireWithoutAutorun>>;

  beforeAll(async () => {
    init = await harness.runInit();
    importProbe = await harness.requireWithoutAutorun();
  }, SPAWNS_TIMEOUT_MS);

  describe('file structure', () => {
    // This describe block is the one place that keeps grading the built esbuild bundle instead
    // of source — it's asking "did the build produce a runnable binary at the expected path?",
    // which only dist/ can answer. `npm run build` is its prerequisite; run it before these
    // tests or they fail on a clean checkout even though nothing here is broken.
    it('VALID: {} => bin file exists', () => {
      expect(harness.binExists()).toBe(true);
    });

    it('VALID: {} => bin file is executable', () => {
      expect(harness.binIsExecutable()).toBe(true);
    });

    it('VALID: {} => bin file has shebang', () => {
      expect(harness.readBinContent().startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('process execution', () => {
    it('VALID: {non-TTY, init} => runs init command and exits successfully', () => {
      expect(init.exitCode).toBe(ExitCodeStub({ value: 0 }));
    });

    it('VALID: {required as a module} => exits cleanly without booting the server or opening a browser', () => {
      expect(importProbe).toStrictEqual({
        exitedCleanly: true,
        servedLineSeen: false,
      });
    });
  });
});

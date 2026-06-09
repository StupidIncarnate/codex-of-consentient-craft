/**
 * PURPOSE: Integration tests for the dungeonmaster CLI binary built from cli-entry
 *
 * USAGE:
 * npm test -- cli-entry.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { cliBinHarness } from '../test/harnesses/cli-bin/cli-bin.harness';

const TIMEOUT_MS = 5000;

describe('dungeonmaster binary', () => {
  const harness = cliBinHarness();

  describe('file structure', () => {
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
    it(
      'VALID: {non-TTY, init} => runs init command and exits successfully',
      async () => {
        const { exitCode } = await harness.runInit();

        expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
      },
      TIMEOUT_MS,
    );

    it(
      'VALID: {required as a module} => exits cleanly without booting the server or opening a browser',
      async () => {
        const { exitedCleanly, servedLineSeen } = await harness.requireWithoutAutorun();

        expect({ exitedCleanly, servedLineSeen }).toStrictEqual({
          exitedCleanly: true,
          servedLineSeen: false,
        });
      },
      TIMEOUT_MS,
    );
  });
});

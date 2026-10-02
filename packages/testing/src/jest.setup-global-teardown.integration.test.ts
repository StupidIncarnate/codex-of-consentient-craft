/**
 * Tests for jest.setup-global-teardown
 */

import { ensureDirSync, existsSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { cwd, deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import globalTeardown from './jest.setup-global-teardown';

describe('jest.setup-global-teardown', () => {
  describe('globalTeardown', () => {
    it('EMPTY: {DUNGEONMASTER_TEST_REAL_HOME: undefined} => leaves HOME directory untouched', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}real-home-standin-${String(Date.now())}`,
      );

      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      deleteEnv('DUNGEONMASTER_TEST_REAL_HOME');

      globalTeardown();

      const existsAfter = existsSync(testDir);
      rmSync(testDir, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);

      expect(existsAfter).toBe(true);
    });

    it('EDGE: {sandboxHome: realHome} => leaves HOME directory untouched', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}same-home-${String(Date.now())}`,
      );

      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', testDir);

      globalTeardown();

      const existsAfter = existsSync(testDir);
      rmSync(testDir, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);

      expect(existsAfter).toBe(true);
    });

    it('EDGE: {sandboxHome: outside tmpdir} => leaves HOME directory untouched', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const testDir = join(
        cwd(),
        'tests',
        'tmp',
        `${globalTeardown.SANDBOX_PREFIX}outside-tmp-${String(Date.now())}`,
      );

      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', join(tmpdir(), `real-home-${String(Date.now())}`));

      globalTeardown();

      const existsAfter = existsSync(testDir);
      rmSync(testDir, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);

      expect(existsAfter).toBe(true);
    });

    it('INVALID: {sandboxHome: without sandbox prefix} => leaves HOME directory untouched', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const testDir = join(tmpdir(), `not-matching-prefix-${String(Date.now())}`);

      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', join(tmpdir(), `real-home-${String(Date.now())}`));

      globalTeardown();

      const existsAfter = existsSync(testDir);
      rmSync(testDir, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);

      expect(existsAfter).toBe(true);
    });

    it('VALID: {setup ran properly} => deletes sandbox directory', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const originalProjectsBefore = String(
        getEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE'),
      );
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}valid-sandbox-${String(Date.now())}`,
      );

      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', join(tmpdir(), `real-home-${String(Date.now())}`));
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', '[]');

      globalTeardown();

      const existsAfter = existsSync(testDir);
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', originalProjectsBefore);

      expect(existsAfter).toBe(false);
    });

    it('ERROR: {leaked projects detected} => throws leak error and deletes sandbox directory', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const originalProjectsBefore = String(
        getEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE'),
      );
      const fakeRealHome = join(tmpdir(), `real-home-${String(Date.now())}`);
      const leakedDir = join(
        fakeRealHome,
        '.claude',
        'projects',
        'session-forensics-flow-integration-test-leak',
      );
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}leak-sandbox-${String(Date.now())}`,
      );

      ensureDirSync(leakedDir);
      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', fakeRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', '[]');

      expect(() => {
        globalTeardown();
      }).toThrow(/the HOME sandbox did not hold/u);

      const existsAfter = existsSync(testDir);
      rmSync(fakeRealHome, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', originalProjectsBefore);

      expect(existsAfter).toBe(false);
    });

    it('VALID: {tmp-encoded folder from another session} => does not flag as leak and teardown succeeds', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const originalProjectsBefore = String(
        getEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE'),
      );
      const fakeRealHome = join(tmpdir(), `real-home-${String(Date.now())}`);
      const otherSessionDir = join(
        fakeRealHome,
        '.claude',
        'projects',
        '-tmp-claude-1001--home-brutus-home-projects-other-session-scratchpad',
      );
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}other-session-sandbox-${String(Date.now())}`,
      );

      ensureDirSync(otherSessionDir);
      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', fakeRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', '[]');

      globalTeardown();

      const existsAfter = existsSync(testDir);
      rmSync(fakeRealHome, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', originalProjectsBefore);

      expect(existsAfter).toBe(false);
    });

    it('ERROR: {leaked directory originating from sandbox detected} => throws leak error and deletes sandbox directory', () => {
      const originalHome = String(getEnv('HOME'));
      const originalRealHome = String(getEnv('DUNGEONMASTER_TEST_REAL_HOME'));
      const originalProjectsBefore = String(
        getEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE'),
      );
      const fakeRealHome = join(tmpdir(), `real-home-${String(Date.now())}`);
      const testDir = join(
        tmpdir(),
        `${globalTeardown.SANDBOX_PREFIX}sandbox-leak-${String(Date.now())}`,
      );
      const testDirSlug = testDir.replace(/[^a-zA-Z0-9]/gu, '-');
      const leakedDir = join(
        fakeRealHome,
        '.claude',
        'projects',
        `${testDirSlug}-scratchpad-subproject`,
      );
      const otherSessionDir = join(
        fakeRealHome,
        '.claude',
        'projects',
        '-tmp-claude-1001--home-brutus-home-projects-other-session-scratchpad',
      );

      ensureDirSync(leakedDir);
      ensureDirSync(otherSessionDir);
      ensureDirSync(testDir);
      setEnv('HOME', testDir);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', fakeRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', '[]');

      expect(() => {
        globalTeardown();
      }).toThrow(/the HOME sandbox did not hold/u);

      const existsAfter = existsSync(testDir);
      rmSync(fakeRealHome, { recursive: true, force: true });
      setEnv('HOME', originalHome);
      setEnv('DUNGEONMASTER_TEST_REAL_HOME', originalRealHome);
      setEnv('DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE', originalProjectsBefore);

      expect(existsAfter).toBe(false);
    });
  });
});

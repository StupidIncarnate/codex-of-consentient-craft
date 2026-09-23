// Jest `globalTeardown` — the counterpart to `jest.setup-global.js`, run once in the same main Jest
// process after every worker has exited. Two jobs: prove the HOME sandbox actually held (nothing
// wrote into the developer's REAL `~/.claude/projects` this run), then remove the sandbox.
//
// The leak check is deliberately a BEFORE/AFTER diff rather than "does any matching directory exist
// now": a directory left behind by an earlier, already-reported crash must not be re-blamed on THIS
// run, and the developer's own live Claude sessions (real repo cwds, encoded the same way) must
// never be flagged at all — this only ever matches directories whose name encodes a path under the
// OS tmp dir, or the session-forensics fixture prefix, neither of which a real interactive session
// ever produces.

const { readdirSync, rmSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const CLAUDE_DIR_NAME = '.claude';
const CLAUDE_PROJECTS_DIR_NAME = 'projects';
// Mirrors claudePathSlugEncoderTransformer's own encoding rule (every non-alphanumeric character
// becomes a literal '-'), applied to `os.tmpdir()` itself: every guild/testbed/sandbox directory a
// test creates lives under the OS tmp dir, so a Claude CLI (real or fake) spawned with one of those
// as `cwd` writes its transcript under a project directory whose name starts with this prefix.
const NON_ALPHANUMERIC_PATTERN = /[^a-zA-Z0-9]/gu;
// `realTranscriptHarness` (session-forensics) writes fixture transcripts directly under the real
// `~/.claude/projects/`, cleaning up in its own `afterEach` — this is the second name a crashed run
// can leave behind.
const SESSION_FORENSICS_PREFIX = 'session-forensics-flow-integration-test-';

module.exports = function globalTeardown() {
  const sandboxHome = process.env.HOME;
  const realHome = process.env.DUNGEONMASTER_TEST_REAL_HOME;

  try {
    if (realHome === undefined) {
      // globalSetup never ran (or ran under a different mechanism) — nothing to diff against.
      return;
    }

    const projectsDir = join(realHome, CLAUDE_DIR_NAME, CLAUDE_PROJECTS_DIR_NAME);
    let projectsAfter = [];
    try {
      projectsAfter = readdirSync(projectsDir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    const projectsBefore = JSON.parse(
      process.env.DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE ?? '[]',
    );
    const beforeSet = new Set(projectsBefore);
    const tmpSlugPrefix = tmpdir().replace(NON_ALPHANUMERIC_PATTERN, '-');

    const leaked = projectsAfter.filter(
      (name) =>
        !beforeSet.has(name) &&
        (name.startsWith(tmpSlugPrefix) || name.startsWith(SESSION_FORENSICS_PREFIX)),
    );

    if (leaked.length > 0) {
      throw new Error(
        `jest.setup-global-teardown: ${String(leaked.length)} new director${leaked.length === 1 ? 'y' : 'ies'} ` +
          `appeared under the REAL ${projectsDir} during this run — the HOME sandbox did not hold: ` +
          `${leaked.join(', ')}`,
      );
    }
  } finally {
    if (sandboxHome !== undefined) {
      rmSync(sandboxHome, { recursive: true, force: true });
    }
  }
};

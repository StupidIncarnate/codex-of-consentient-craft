// Jest `globalSetup` — runs exactly ONCE, in the main Jest process, BEFORE any worker forks. That
// timing is the whole reason this file exists rather than folding into `jest.setup-home.js`
// (a `setupFiles` entry, re-run per test FILE, inside an already-forked worker): a worker inherits
// `process.env` from the OS process that spawned it, so a `HOME` assigned here reaches the real
// environ every worker's `os.homedir()` reads — and, because child processes inherit their parent's
// environment too, every process a test spawns (a fake Claude CLI, a real `git`). Assigning
// `process.env.HOME` from inside a worker (a `setupFiles` entry, a harness inside a test body) does
// NOT work: jest-environment-node hands each test FILE a copied `process.env` proxy, so the
// assignment never reaches the real environ libuv already read when the worker started.
//
// Without this file, every jest run in this repo reads and writes the DEVELOPER'S OWN home: a fake
// Claude CLI spawned by an integration harness writes real session JSONL under
// `~/.claude/projects/<encoded-cwd>`, `chat-subagent-tail-broker` creates files there,
// `realTranscriptHarness` (session-forensics) writes fixture transcripts there, and a real `git
// commit` inside a throwaway fixture repo reads the developer's own `~/.gitconfig` — which is how a
// fixture commit can pass on one machine's global git identity and fail on another's.

const { mkdirSync, readdirSync, writeFileSync } = require('fs');
const { homedir, tmpdir } = require('os');
const { join } = require('path');

const SANDBOX_PREFIX = 'dungeonmaster-jest-sandbox-';
const CLAUDE_DIR_NAME = '.claude';
const CLAUDE_PROJECTS_DIR_NAME = 'projects';
const GIT_USER_NAME = 'Dungeonmaster Jest Sandbox';
const GIT_USER_EMAIL = 'jest-sandbox@dungeonmaster.test';

module.exports = function globalSetup() {
  // Captured BEFORE any env mutation below — this is the only point in the run this process can
  // still read the real value.
  const realHome = homedir();

  // A sandboxed HOME must never make Playwright think it needs a fresh Chromium download: the
  // browser cache lives under the REAL home and has nothing to do with which git/Claude config a
  // test reads. `??=` leaves an operator- or CI-supplied path untouched.
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= join(realHome, '.cache', 'ms-playwright');

  // One sandbox for the WHOLE run (this is the main process, not a per-worker one — contrast
  // `jest.setup-home.js`'s per-worker `DUNGEONMASTER_HOME` sandbox, keyed on the worker's own pid).
  const sandboxHome = join(tmpdir(), `${SANDBOX_PREFIX}${String(process.pid)}`);
  const xdgConfigHome = join(sandboxHome, '.config');
  const xdgCacheHome = join(sandboxHome, '.cache');
  mkdirSync(sandboxHome, { recursive: true });
  mkdirSync(xdgConfigHome, { recursive: true });
  mkdirSync(xdgCacheHome, { recursive: true });

  // Real committer identity + disabled signing, scoped to THIS sandbox's own `$HOME/.gitconfig`
  // rather than per-spawn `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_*` env vars: three harnesses
  // (git-worktree-fixture, orchestration-quest, environment) already set those themselves for their
  // own throwaway repos, and a value set here too would collide with theirs instead of layering
  // under them. A sandboxed `$HOME` is invisible to a real repo's own `.git/config`, so this changes
  // nothing about which commits land where — only what an otherwise-unconfigured `git commit` falls
  // back to.
  writeFileSync(
    join(sandboxHome, '.gitconfig'),
    [
      '[user]',
      `\tname = ${GIT_USER_NAME}`,
      `\temail = ${GIT_USER_EMAIL}`,
      '[init]',
      '\tdefaultBranch = main',
      '[commit]',
      '\tgpgsign = false',
      '[tag]',
      '\tgpgsign = false',
      '',
    ].join('\n'),
  );

  process.env.HOME = sandboxHome;
  // git reads `$XDG_CONFIG_HOME/git/config` ahead of `$HOME/.gitconfig`; a developer's own XDG
  // config/cache dirs must not leak into a sandboxed run any more than `$HOME` itself does.
  process.env.XDG_CONFIG_HOME = xdgConfigHome;
  process.env.XDG_CACHE_HOME = xdgCacheHome;
  // `/etc/gitconfig` sits outside every sandbox this file can build; refusing to read it is the
  // only way to guarantee the machine's system config can never supply an identity or a default
  // branch a test then depends on.
  process.env.GIT_CONFIG_NOSYSTEM = '1';
  // A developer's own shell may export this for their interactive Claude Code use. Left set, it
  // would route every test's Claude-config reads at that real folder instead of the sandbox.
  Reflect.deleteProperty(process.env, 'CLAUDE_CONFIG_DIR');

  // Handed to `jest.setup-global-teardown.js`, which runs in this SAME main Jest process (globalSetup
  // and globalTeardown are never forked into a worker), so a plain `process.env` round-trip is
  // enough — nothing here needs to survive a process boundary.
  process.env.DUNGEONMASTER_TEST_REAL_HOME = realHome;
  const realProjectsDir = join(realHome, CLAUDE_DIR_NAME, CLAUDE_PROJECTS_DIR_NAME);
  let projectsBefore = [];
  try {
    projectsBefore = readdirSync(realProjectsDir);
  } catch (error) {
    // ENOENT — this machine has never run the real Claude CLI, so there is nothing to snapshot.
    // Anything else is a real problem, but throwing it here would fail the whole run over a check
    // that exists only to catch a leak once the run is otherwise done.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  process.env.DUNGEONMASTER_TEST_REAL_CLAUDE_PROJECTS_BEFORE = JSON.stringify(projectsBefore);
};

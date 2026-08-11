/**
 * PURPOSE: Manages guild directory setup and cleanup for E2E tests, including a real throwaway git
 * repository (a `main` branch with two commits, a `.dungeonmaster.json` that overrides the build to
 * a no-op, and a minimal workspace + node_modules layout) so that Quest Start's base-branch probe
 * and its synchronous worktree-add / node_modules-populate / build sequence — real git and fs calls,
 * not mocks — have a real repo to run against instead of the bare temp directory Playwright's guild
 * paths used to be.
 *
 * USAGE:
 * const env = environmentHarness({ guildPath: '/tmp/dm-e2e-test' });
 * // beforeEach: creates guild directory + fixture repo, clears stale session JSONL files
 * // Call env.cleanup() or rely on afterEach if wired
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

// Real committer identity + disabled GPG signing, scoped to the child process env (not `-c` argv
// flags, not a `git config` write) so these throwaway fixture commits never depend on, or mutate,
// the developer's real global git config. Mirrors
// packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts's own
// GIT_COMMIT_ENV rather than importing it — that harness is Jest-side or the orchestrator package,
// this one is Playwright-side of the web package, and the two fixture shapes are free to diverge.
const GIT_COMMIT_ENV = {
  GIT_AUTHOR_NAME: 'Dungeonmaster E2E Fixture',
  GIT_AUTHOR_EMAIL: 'e2e-fixture@dungeonmaster.test',
  GIT_COMMITTER_NAME: 'Dungeonmaster E2E Fixture',
  GIT_COMMITTER_EMAIL: 'e2e-fixture@dungeonmaster.test',
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'commit.gpgsign',
  GIT_CONFIG_VALUE_0: 'false',
};

// Never read by Start (only devServer.buildCommand is), but devServer.devCommand + .port are
// non-optional the moment the devServer key is present at all — dungeonmasterConfigContract has no
// default for either — so a syntactically valid override of buildCommand still has to carry them.
const FIXTURE_DEV_SERVER_PORT = 47001;
const FIXTURE_PACKAGE_NAME = 'demo';

export const environmentHarness = ({
  guildPath,
}: {
  guildPath: string;
}): {
  beforeEach: () => void;
  setupGuildPath: () => void;
  cleanup: () => void;
  getHomedir: () => FilePath;
} => {
  const clearStaleJsonlForGuild = (): void => {
    // Default sessionId stubs share `e2e-session-00000000-0000-0000-0000-000000000000`,
    // and JSONL files are keyed by encoded cwd (guildPath). Without this clear, a JSONL
    // written by a prior test with the same guildPath gets replayed into the next test
    // via subscribe-quest before the current fake CLI overwrites it — UI shows stale text.
    const jsonlDir = FilePathStub({
      value: path.join(os.homedir(), '.claude', 'projects', guildPath.replace(/\//gu, '-')),
    });
    fs.rmSync(jsonlDir, { recursive: true, force: true });
  };

  const runGit = (args: readonly string[]): void => {
    execFileSync('git', [...args], {
      cwd: guildPath,
      env: { ...process.env, ...GIT_COMMIT_ENV },
      stdio: 'ignore',
    });
  };

  // Quest Start (packages/orchestrator's prepare-quest-worktree-layer-responder) resolves the
  // quest's repo root by walking UP from the guild path looking for `.dungeonmaster.json`, then
  // probes that root for a local `main`/`master` branch and — once found — runs `git worktree add`,
  // mirrors node_modules into the new worktree, and runs the configured build command, all
  // synchronously inside the POST /start request. Every one of those steps is a real git/fs/spawn
  // call against the quest's GUILD path, so making Start succeed under e2e means the guild path
  // itself has to be a real repo, not a bare temp directory: a `main` branch with two DIFFERENT
  // commits (so "the tip" and "an older commit" are distinguishable), a `.dungeonmaster.json` right
  // at the guild root (so config resolution finds it on the FIRST directory it checks rather than
  // walking past `/tmp` and falling back), overriding the build to a no-op so the monorepo's real
  // multi-minute build is never what an e2e run waits on, and a minimal node_modules + workspace
  // package so the population step mirrors a real (if tiny) `@dungeonmaster/*` scope symlink rather
  // than skipping the step's own logic entirely on an empty directory.
  const ensureFixtureRepo = (): void => {
    if (fs.existsSync(path.join(guildPath, '.git'))) {
      return;
    }

    runGit(['init', '-b', 'main']);

    fs.writeFileSync(
      path.join(guildPath, '.dungeonmaster.json'),
      JSON.stringify(
        {
          framework: 'monorepo',
          schema: 'zod',
          devServer: {
            devCommand: 'true',
            port: FIXTURE_DEV_SERVER_PORT,
            buildCommand: 'true',
          },
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(path.join(guildPath, 'README.md'), '# e2e fixture repo\n');
    const packageDir = path.join(guildPath, 'packages', FIXTURE_PACKAGE_NAME);
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(
      path.join(packageDir, 'package.json'),
      JSON.stringify({ name: `@dungeonmaster/${FIXTURE_PACKAGE_NAME}`, version: '1.0.0' }, null, 2),
    );
    runGit(['add', '-A']);
    runGit(['commit', '-m', 'e2e fixture: base']);

    // A second, distinct commit — some worktree-lifecycle invariants need the branch tip and an
    // older reachable commit to be different shas, which one commit alone can never provide.
    fs.appendFileSync(path.join(guildPath, 'README.md'), 'second commit\n');
    runGit(['add', '-A']);
    runGit(['commit', '-m', 'e2e fixture: second commit']);

    // node_modules is real but untracked (exactly as in production — it is never a git commit),
    // which is why it is created AFTER the commits above rather than added to them.
    // worktreePopulateNodeModulesBroker mirrors it FROM this repo root INTO the new worktree, so it
    // has to exist for that step to succeed instead of throwing ENOENT on a directory nothing ever
    // created. The `@dungeonmaster/demo` entry is a real relative symlink into packages/demo,
    // exercising the SAME scope-rewrite path production hits (see populate-one-root-layer-broker's
    // PURPOSE) rather than a source node_modules with nothing to mirror.
    const nodeModules = path.join(guildPath, 'node_modules');
    const scopeDir = path.join(nodeModules, '@dungeonmaster');
    fs.mkdirSync(scopeDir, { recursive: true });
    fs.symlinkSync(
      path.join('..', '..', 'packages', FIXTURE_PACKAGE_NAME),
      path.join(scopeDir, FIXTURE_PACKAGE_NAME),
    );
    fs.mkdirSync(path.join(nodeModules, 'zod'), { recursive: true });
  };

  const setupGuildPath = (): void => {
    clearStaleJsonlForGuild();
    fs.mkdirSync(guildPath, { recursive: true });
    ensureFixtureRepo();
  };

  const cleanup = (): void => {
    fs.rmSync(guildPath, { recursive: true, force: true });
  };

  const getHomedir = (): FilePath => FilePathStub({ value: os.homedir() });

  return {
    beforeEach: setupGuildPath,
    setupGuildPath,
    cleanup,
    getHomedir,
  };
};

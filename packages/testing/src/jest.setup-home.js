// Gives every jest WORKER its own sandbox `DUNGEONMASTER_HOME`, one per worker pid, reused across
// every test file that worker runs. Runs as a `setupFiles` entry, not `setupFilesAfterEnv`, because
// that is the only hook that lands BEFORE the test file's own imports: `@dungeonmaster/orchestrator`'s
// barrel runs six bootstraps at MODULE LOAD, one of which is the rate-limit guardrail poller, and
// its first pass reads whatever `DUNGEONMASTER_HOME` names at that moment — a harness that only
// sets the env var inside a test body sets it too late for that first pass.
//
// This sandbox holds `DUNGEONMASTER_HOME` only — the dungeonmaster-specific data dir (guild
// configs, the usage ledger, dispatch state). It is separate from, and complementary to, the
// process-wide `HOME` sandbox `jest.setup-global.js` builds in the `globalSetup` hook, before any
// worker forks — which is what lets THAT file redirect the real `os.homedir()` itself; a
// `setupFiles` entry like this one cannot, because jest-environment-node hands each test FILE a
// copied `process.env` proxy, so an assignment made here never reaches the real environ libuv
// already read when this worker started.
//
// Because `HOME` is now sandboxed for the whole run, `usageLedgerScanBroker`'s walk of
// `locationsClaudeProjectsRootFindBroker()` (which resolves through `osUserHomedirAdapter`, the
// real `os.homedir()`) lands on an empty directory rather than the developer's own
// `~/.claude/projects` tree, so this file no longer seeds a ledger stamped at the current time to
// keep that walk off its slow path — an absent ledger already resolves to the epoch-stamped
// default, and the walk it triggers now finds nothing to read either way. The rate-limits-watcher
// integration harness still seeds its OWN ledger, deliberately, to test specific window/ceiling
// states — that is a different mechanism and is untouched by this file.

const { mkdirSync, readdirSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const GUILD_CONFIG_FILENAME = 'config.json';
const HOME_PREFIX = 'dungeonmaster-jest-home-';
// This file runs once per test FILE; the work under this flag is worth one pass per WORKER.
const ONCE_PER_WORKER_FLAG = '__dungeonmasterJestHomeOnce';

// Per PID, so parallel jest workers never share a home, and one directory serves every test file a
// worker runs rather than one per file. Sharing one directory across workers is what a single
// stable name would buy, and it is the wrong trade: every worker would tail the same
// `event-outbox.jsonl`, so a quest written by one worker's test fires another worker's sync
// listener.
const homePath = join(tmpdir(), `${HOME_PREFIX}${String(process.pid)}`);

// `process.kill(pid, 0)` sends no signal and throws only when nothing owns that pid — the portable
// way to tell a dead owner from a live sibling worker, whose home must stay. A `/proc` check would
// read as dead on every platform that has no `/proc`, and sweep live workers.
const isOwnerAlive = ({ pid }) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the pid exists and belongs to another user, so the owner is alive.
    return error.code === 'EPERM';
  }
};

if (process[ONCE_PER_WORKER_FLAG] !== true) {
  process[ONCE_PER_WORKER_FLAG] = true;

  // The teardown below does not fire on every jest exit path, so a run can leave a home behind.
  // Sweeping the ones whose owning process is gone makes that self-healing rather than litter only
  // the OS tmpdir cleaner removes.
  for (const entry of readdirSync(tmpdir())) {
    if (entry.startsWith(HOME_PREFIX)) {
      const pid = Number(entry.slice(HOME_PREFIX.length));
      if (Number.isInteger(pid) && pid > 0 && !isOwnerAlive({ pid })) {
        rmSync(join(tmpdir(), entry), { recursive: true, force: true });
      }
    }
  }

  // Registered here rather than at file scope: this module is evaluated once per test FILE, so a
  // worker running more than ten of them would trip Node's max-listeners warning on `exit`.
  process.on('exit', () => {
    rmSync(homePath, { recursive: true, force: true });
  });
}

mkdirSync(homePath, { recursive: true });

// Written rather than left absent: guildConfigReadBroker's ENOENT branch turns on
// `cause instanceof Error`, and an error node's own fs raised outside jest's vm realm fails that
// check — so a home with no config.json throws where an empty one returns the default.
writeFileSync(join(homePath, GUILD_CONFIG_FILENAME), JSON.stringify({ guilds: [] }));

process.env.DUNGEONMASTER_HOME = homePath;

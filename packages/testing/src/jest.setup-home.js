// Gives every jest process a sandbox dungeonmaster home, and it runs as a `setupFiles` entry
// rather than `setupFilesAfterEnv` because that is the only hook that lands BEFORE the test file's
// own imports.
//
// `@dungeonmaster/orchestrator`'s barrel runs six bootstraps at MODULE LOAD, one of which is the
// rate-limit guardrail poller. Its first pass reads whatever `DUNGEONMASTER_HOME` names at that
// moment — and a harness sets that inside a test body, long after the import. So without this file
// the first pass resolves to the developer's real `~/.dungeonmaster`, and from there
// `usageLedgerScanBroker` walks the developer's own `~/.claude/projects`: 2,235 transcripts and
// 1.93 GB on one measured machine, of which the 623 files touched in the last seven days are read
// from byte 0. That read lands inside whichever test happens to be running and is billed to it.
// Measured on one integration sweep: 117.6s with the real home, 49.6s with this sandbox, and the
// slow-test gate went from failing to silent.
//
// The ledger stamped NOW is what makes the scan take its throttle path (`minIntervalMs`) instead.
// A home with no ledger gets the default one, stamped at the epoch, which every pass reads as a
// measurement due. The same seed rides every harness that re-points `DUNGEONMASTER_HOME` at a home
// of its own, since a fresh directory has no ledger either.
//
// `os.homedir()` cannot be redirected from inside jest — its `process.env` is a copied object, so
// assigning HOME never reaches the environ libuv reads — so the ledger's timestamp is the only
// lever that keeps that tree out of a run.

const { mkdirSync, readdirSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const GUILD_CONFIG_FILENAME = 'config.json';
const USAGE_LEDGER_FILENAME = 'usage-ledger.json';
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

// Re-stamped per test file rather than once per worker, so the throttle window cannot lapse partway
// through a long suite and let one scan through.
writeFileSync(
  join(homePath, USAGE_LEDGER_FILENAME),
  JSON.stringify({
    buckets: {},
    cursors: {},
    ceilings: { fiveHour: null, sevenDay: null },
    updatedAt: new Date().toISOString(),
  }),
);

process.env.DUNGEONMASTER_HOME = homePath;

/**
 * PURPOSE: Every timing and sizing knob the instance lifecycle reads — id minting, per-run step
 * numbering, the heartbeat that is the only defence against a SIGKILLed driver, the boot lock that
 * enforces one boot at a time across every session on the machine, and how many times a reserve
 * re-rolls a colliding port pair. Values are picked once here so a broker never hand-rolls a
 * timeout and two brokers never disagree on what "stale" means.
 *
 * USAGE:
 * instanceLifecycleStatics.ids.instancePrefix;
 * // Returns 'inst_' — the prefix instanceIdContract's regex requires
 *
 * instanceLifecycleStatics.heartbeat.intervalMs;
 * // Returns 5000 — how often heartbeat-write-broker refreshes heartbeat.json
 */

export const instanceLifecycleStatics = {
  ids: {
    instancePrefix: 'inst_',
    runPrefix: 'run_',
    // randomBytes(4).toString('hex') → 8 hex chars, comfortably above instanceIdContract's
    // 4-char minimum. A pool is policy-capped at three instances at once (siege-tooling.md line
    // 1700), so the 2^32 keyspace this buys makes a same-machine collision practically impossible.
    entropyBytes: 4,
  },
  numbering: {
    // Step numbers restart at 1 per run (siege-tooling.md line 1630): `stoppedAt: { step: 4 }`
    // and `results { run, step: 4 }` must name the same thing.
    firstStep: 1,
  },
  heartbeat: {
    // "updated every few seconds" (siege-tooling.md line 1132-1133).
    intervalMs: 5000,
    // "older than a few beats is presumed dead" (siege-tooling.md line 1135). 3 beats at a
    // 5000ms interval is a 15s staleness window: long enough to absorb one missed tick under
    // load, short enough that start/capacity's opportunistic reap notices a dead instance fast.
    stalenessBeats: 3,
  },
  bootLock: {
    // A real boot of this stack measures ~20-21s (siege-tooling.md lines 1470, 2347: `bootMs:
    // 21000` and `bootMs: 20000`). The TTL is roughly double that, so a boot running slow on a
    // contended machine still holds the lock, but a boot whose driver was SIGKILLed mid-boot
    // releases the lock well inside a minute rather than wedging the queue.
    ttlMs: 45_000,
    // The boot queue admits one boot at a time and a queued start BLOCKS (siege-tooling.md line
    // 1699); the pool ceiling is a policy three (line 1700), so at most two boots can queue ahead
    // of a third — roughly two TTLs of wait in the worst case. 120s is close to six single boots
    // of headroom above that, so a queue working as designed is never mistaken for a hang.
    waitCeilingMs: 120_000,
    // How often the acquire broker re-checks the lock file while waiting. Frequent enough that a
    // caller is not left waiting long after the lock frees; coarse enough not to hammer the
    // registry directory with reads for two minutes straight.
    pollMs: 1000,
  },
  ports: {
    // How many times instance-reserve-broker re-rolls netFreePortPairAdapter's answer against the
    // registry's already-claimed pairs before throwing PortClaimExhaustedError. The pool ceiling
    // of three instances makes a repeated collision against the OS's whole ephemeral range
    // vanishingly unlikely; five attempts absorbs bad luck without spinning indefinitely.
    claimAttempts: 5,
  },
  registryLock: {
    // registryUpdateBroker's whole read-mutate-write is a couple of small file reads/writes, not a
    // 20s boot — so this TTL is two orders of magnitude below bootLock's 45_000ms, not the same
    // "roughly double a real boot" ratio: it only needs to comfortably outlast a slow disk write,
    // not a slow browser launch.
    ttlMs: 2_000,
    // Bounded wait before a caller gives up rather than retrying forever. The pool ceiling of three
    // instances means at most two other updates can be queued ahead of a third; this is generous
    // headroom above that even if every queued update independently hits the stale takeover path.
    waitCeilingMs: 5_000,
    // How often the acquire retries while another process holds a fresh lock. Far shorter than
    // bootLock's 1000ms poll — a registry update finishes in milliseconds, so waiting a full second
    // between checks would make the wait ceiling nearly untestable in practice.
    pollMs: 25,
  },
} as const;

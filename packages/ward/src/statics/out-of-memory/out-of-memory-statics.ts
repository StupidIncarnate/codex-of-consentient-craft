/**
 * PURPOSE: The evidence a check ran out of memory, in the three forms a dying Node process leaves.
 * Reach for this from `isOutOfMemoryFailureGuard` and from anything that has to EXPLAIN such a
 * failure — the guard answers whether, and `reason` is what a reader is told.
 *
 * USAGE:
 * outOfMemoryStatics.exitCodes.abort;
 * // Returns: 134
 */

export const outOfMemoryStatics = {
  output: {
    // V8's own words when it gives up growing the heap. It prints this to stderr and then aborts,
    // so the banner and the abort exit code below usually arrive together — but only the banner
    // PROVES memory, which is why it is matched on its own.
    banner: 'JavaScript heap out of memory',
  },
  exitCodes: {
    // SIGABRT flattened to an exit code by the shell convention 128 + signal. V8 raises SIGABRT on
    // a fatal heap error, so a Node check exiting 134 is out of memory rather than merely failing.
    // Measured: `node --max-old-space-size=64` on a script that allocates forever exits 134.
    abort: 134,
  },
  signals: {
    // Two ways a check's process dies without choosing to. SIGABRT is V8 aborting itself on heap
    // exhaustion. SIGKILL cannot be caught or handled, so nothing inside the process can report it:
    // on a machine running checks, the kernel's out-of-memory reaper is what sends it.
    abort: 'SIGABRT',
    kill: 'SIGKILL',
  },
  reason: {
    heapLimit: 'V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
    aborted: 'the process aborted (SIGABRT), which is how V8 ends a run it cannot allocate for',
    killed:
      'the process was killed from outside (SIGKILL) — on a machine running checks that is the kernel out-of-memory reaper',
  },
} as const;

/**
 * PURPOSE: The two directory names a measured profile is filed under inside `profiles/<specHash>/`,
 * the extension each per-instance record takes, the settle window that decides when a beat stops
 * counting as boot and starts counting as steady, and table formatting constants for rendering
 * human profile summaries. These stay out of `locationsStatics`: that file's
 * `no-bare-location-literals` ban is repo-wide, and this package's `evidenceFileStatics` already
 * carries the precedent for filename vocabulary only one package composes. Reach for this over
 * `evidenceFileStatics` when the file being named belongs to a PROFILE rather than to one instance's
 * evidence — the two trees are keyed differently (spec hash against instance id) and outlive each
 * other independently.
 *
 * USAGE:
 * profileStatics.dirs.samples;
 * // Returns 'samples'
 *
 * profileStatics.settle.afterMs;
 * // Returns 30000 — how long after an instance's first beat a reading counts toward STEADY
 *
 * profileStatics.table.headers;
 * // Returns ['POOL', 'STEADY', 'PEAK', 'RUNS']
 */

export const profileStatics = {
  dirs: {
    // One writer per file, and never the same file from two OS processes: the driver owns its
    // sample record, the `start` client owns its boot record. Two directories rather than two keys
    // in one document is what keeps the profile from being the second place in this design that
    // needs a lock.
    samples: 'samples',
    boots: 'boots',
  },
  extensions: {
    record: '.json',
  },
  settle: {
    // siegelense-tooling.md line 1470: STEADY is "what it settles at", PEAK is "what it spikes to,
    // which is boot". The heartbeat ticker starts once the lane is up, so the earliest beats are
    // the closest thing to the boot spike anything here observes; a reading counts toward steady
    // only once this long has passed since the record's first beat. 30s sits past the measured
    // ~20s boot (driverStatics.boot's own notes) without discarding a short run entirely.
    afterMs: 30_000,
  },
  table: {
    headers: ['POOL', 'STEADY', 'PEAK', 'RUNS'] as const,
    cellPadding: 2,
  },
} as const;

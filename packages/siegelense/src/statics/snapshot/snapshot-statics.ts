/**
 * PURPOSE: The knobs the snapshot store is built from — where it lives inside an instance's throwaway
 * home, the two suffixes that namespace the automatic `run_N:start`/`run_N:end` pair away from every
 * name a caller can type, and the retention ceiling the spec calls "a knob, not a given". These stay
 * out of `locationsStatics` for the reason `evidenceFileStatics`' own header gives: that file's
 * `no-bare-location-literals` ban is repo-wide, so a fragment landing there claims every OTHER
 * package's unrelated use of the same string. Reach for this over `evidenceFileStatics` whenever the
 * value describes STATE a reset rewinds rather than EVIDENCE that accumulates forward — the two live
 * in different directories on purpose (siegelense-tooling.md line 1060).
 *
 * USAGE:
 * snapshotStatics.store.dirName;
 * // Returns '.siegelense-snapshots'
 *
 * snapshotStatics.automatic.startSuffix;
 * // Returns ':start'
 */

export const snapshotStatics = {
  store: {
    // Sits INSIDE the throwaway home, because `laneTeardownBroker` removes exactly that directory and
    // nothing else — the only placement where "snapshots are gone with the instance"
    // (siegelense-tooling.md line 1060-1061) holds without teardown having to know this store exists.
    // Every payload copy excludes this directory, or the copy would contain itself.
    dirName: '.siegelense-snapshots',
    indexFileName: 'index.jsonl',
  },
  automatic: {
    // siegelense-tooling.md line 2630: "Every run also snapshots automatically, at start and at end,
    // namespaced so an explicit name can never collide." The colon is what does the namespacing, and
    // `snapshotCaptureBroker` refuses a MANUAL name carrying either suffix rather than trusting the
    // shape to be unreachable by accident.
    startSuffix: ':start',
    endSuffix: ':end',
  },
  limits: {
    maxNameLength: 64,
  },
  numbering: {
    // Payload directories are numbered from 1, matching this package's other 1-based counters
    // (`instanceLifecycleStatics.numbering.firstStep`, `RunId`'s own `run_1`).
    firstPayload: 1,
  },
  retention: {
    // siegelense-tooling.md line 2646: "Retention is a knob, not a given. Twenty runs means forty
    // automatic snapshots. For a throwaway home that is usually fine; where it is not, keep the most
    // recent N plus every manually named one." Nothing reads this yet — the ceiling is declared here
    // so the value a future reaper enforces has one home rather than being invented at the call site.
    keepAutomatic: 40,
  },
} as const;

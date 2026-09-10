/**
 * PURPOSE: Names the env var ward sets to ask `@dungeonmaster/testing` for open-handle findings, and
 * how the file it asks for is named. Reach for this over jest's `--detectOpenHandles` wherever the
 * run uses WORKERS: jest collects handles on the main thread only, so that flag reports nothing
 * there, and setting it forces the whole run in band.
 *
 * USAGE:
 * openHandleReportStatics.env.pathVar;
 * // Returns 'DUNGEONMASTER_OPEN_HANDLE_REPORT'
 */
export const openHandleReportStatics = {
  env: {
    // `@dungeonmaster/testing`'s jest setup spells this same name independently, and deliberately:
    // ward is published, so a consumer can be running a testing version that has never heard of it.
    // A mismatch costs the findings and nothing else.
    pathVar: 'DUNGEONMASTER_OPEN_HANDLE_REPORT',
  },
  file: {
    // The OS scratch dir, never the package: ward GRADES untracked files on `--uncommitted`, so a
    // report left in the repo by a killed run becomes a file the next run tries to lint.
    prefix: 'ward-open-handles-',
    suffix: '.jsonl',
  },
} as const;

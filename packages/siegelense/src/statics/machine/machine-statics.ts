/**
 * PURPOSE: The `status` call's own vocabulary — the five metric names a session can ask about,
 * verbatim from siegelense-tooling.md line 1170, plus the procfs paths and unit conversion a
 * machine-reading broker parses them from. Reach for this over `perceptionStatics` when the value
 * describes host or process health rather than a captured screenshot.
 *
 * USAGE:
 * machineStatics.monitored;
 * // Returns ['rss per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events']
 */

export const machineStatics = {
  // siegelense-tooling.md line 1170's own order. Line 1191: "monitored answers 'what can I even
  // ask about'. Without it a session guesses at metric names, and a guess that returns nothing
  // reads exactly like a metric that is zero."
  monitored: [
    'rss per process group',
    'free memory',
    'free disk',
    'load average',
    'kernel OOM events',
  ],
  procfs: {
    root: '/proc',
    vmstat: 'vmstat',
    stat: 'stat',
    statm: 'statm',
    cmdline: 'cmdline',
    oomKillKey: 'oom_kill',
    pageSizeBytes: 4096,
    pgrpField: 4,
    rssPagesField: 1,
  },
  units: {
    bytesPerMegabyte: 1_048_576,
  },
} as const;

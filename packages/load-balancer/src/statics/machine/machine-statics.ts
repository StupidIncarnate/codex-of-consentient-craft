/**
 * PURPOSE: The machine monitoring vocabulary — the five metric names a session can ask about,
 * plus the procfs paths and unit conversion a machine-reading broker parses them from. Reach
 * for this over perception statics when the value describes host or process health.
 *
 * USAGE:
 * machineStatics.monitored;
 * // Returns ['memory per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events']
 */

export const machineStatics = {
  monitored: [
    'memory per process group',
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

/**
 * PURPOSE: Caps the total bytes of run-result files one `.ward/` folder keeps, on top of the age
 * limit in `ttlStatics`. Age alone bounds nothing when runs are frequent: one repo's root `.ward/`
 * held 3,716 files and 15.2GB inside the 2-day window, with single files near 286MB.
 *
 * USAGE:
 * storageBudgetStatics.limits.runResultsPerFolderBytes;
 * // Returns: 524288000 (500 MiB)
 */
export const storageBudgetStatics = {
  limits: {
    runResultsPerFolderBytes: 524288000,
  },
} as const;

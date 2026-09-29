/**
 * PURPOSE: The fixed knobs of `ward scan`: how ESLint is invoked, where the generated wrapper
 * config lives, which exit codes mean the scan ran, and how many files a hand-queue batch may hold.
 *
 * USAGE:
 * scanStatics.eslint.severity;
 * // Returns: 'error'
 */

export const scanStatics = {
  batch: {
    maxFiles: 4,
  },
  eslint: {
    bin: 'eslint',
    // No `--fix`: a scan is a measurement and must leave the tree as it found it. No `--stats`
    // either; nothing here reads timings.
    formatArgs: ['--format', 'json', '--no-warn-ignored'],
    configFlag: '--config',
    severity: 'error',
  },
  config: {
    wrapperName: 'eslint.scan.config.cjs',
    tempDirPrefix: 'ward-scan-',
  },
  exitCodes: {
    clean: 0,
    violationsFound: 1,
  },
} as const;

/**
 * PURPOSE: Static definitions and formatting patterns for the `health` step verb — root container
 * selector ('#root'), verdict values ('HEALTHY', 'DEGRADED', 'DOWN'), and the separator and token
 * strings used by healthReadingRenderTransformer.
 *
 * USAGE:
 * healthStatics.selectors.root;
 * // Returns '#root'
 *
 * healthStatics.verdicts.healthy;
 * // Returns 'HEALTHY'
 */

export const healthStatics = {
  selectors: {
    root: '#root',
  },
  verdicts: {
    healthy: 'HEALTHY',
    degraded: 'DEGRADED',
    down: 'DOWN',
    all: ['HEALTHY', 'DEGRADED', 'DOWN'] as const,
  },
  formatting: {
    separator: ' · ',
    rootPresent: 'root present',
    rootAbsent: 'root absent',
    notBlank: 'not blank',
    consoleClean: 'console clean',
    no5xx: 'no 5xx',
    serverClean: 'server log clean',
    verdictPaddedLength: 10,
  },
} as const;

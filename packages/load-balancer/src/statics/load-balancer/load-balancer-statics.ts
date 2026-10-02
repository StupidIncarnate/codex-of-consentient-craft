/**
 * PURPOSE: Starting point for this package's statics — replace with real config values as the
 * package grows.
 *
 * USAGE:
 * loadBalancerStatics.packageName;
 */

export const loadBalancerStatics = {
  packageName: 'load-balancer',
  registry: {
    dirEnvVar: 'DUNGEONMASTER_LOAD_DIR',
    homeRelativeDir: '.dungeonmaster/load',
    fileName: 'registry-v1.db',
    busyTimeoutMs: 5000,
  },
} as const;

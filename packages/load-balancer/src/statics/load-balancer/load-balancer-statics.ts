/**
 * PURPOSE: Machine load balancer configuration constants, registry settings, lease timing, and capacity knobs.
 *
 * USAGE:
 * loadBalancerStatics.lease.heartbeatIntervalMs;
 * // Returns 5000
 */

export const loadBalancerStatics = {
  packageName: 'load-balancer',
  registry: {
    dirEnvVar: 'DUNGEONMASTER_LOAD_DIR',
    homeRelativeDir: '.dungeonmaster/load',
    fileName: 'registry-v1.db',
    busyTimeoutMs: 5000,
  },
  lease: {
    heartbeatIntervalMs: 5000,
    staleAfterMs: 30000,
  },
  memory: {
    headroomMB: 512,
  },
  cpu: {
    minAllowed: 1,
  },
} as const;

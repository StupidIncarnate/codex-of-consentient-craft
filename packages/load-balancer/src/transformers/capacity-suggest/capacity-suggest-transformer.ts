/**
 * PURPOSE: Computes the recommended capacity for concurrent execution based on host machine readings,
 * active leases, and per-job memory requirements. Reach for this over siegelense capacitySuggestTransformer
 * when computing capacity for arbitrary jobs across ward and siegelense using shared machine leases.
 *
 * USAGE:
 * capacitySuggestTransformer({
 *   machine: machineReading,
 *   liveLeases: [lease],
 *   job: { peakMB: 512 },
 *   maxMemoryPercent: 80,
 * });
 * // Returns: LoadCapacitySuggestion
 */

import { loadCapacitySuggestionContract } from '../../contracts/load-capacity-suggestion/load-capacity-suggestion-contract';
import type { LoadCapacitySuggestion } from '../../contracts/load-capacity-suggestion/load-capacity-suggestion-contract';
import type { Lease } from '../../contracts/lease/lease-contract';
import type { MachineReading } from '../../contracts/machine-reading/machine-reading-contract';
import { loadBalancerStatics } from '../../statics/load-balancer/load-balancer-statics';

const RECENT_LEASE_WINDOW_MS = 60_000;
const PERCENT_DIVISOR = 100;
const FLOOR_MINIMUM = 0;

export const capacitySuggestTransformer = ({
  machine,
  liveLeases,
  job,
  maxMemoryPercent,
  nowMs = Date.now(),
}: {
  machine: MachineReading;
  liveLeases: readonly Lease[];
  job: { peakMB: number | null };
  maxMemoryPercent: number;
  nowMs?: number;
}): LoadCapacitySuggestion => {
  const [loadAvg1] = machine.loadAvg;

  const recentInFlightLeases = liveLeases.filter(
    (lease) => nowMs - lease.startedAtMs < RECENT_LEASE_WINDOW_MS,
  ).length;

  const rawCpuLimit =
    Math.max(loadBalancerStatics.cpu.minAllowed, Math.floor(machine.cores - loadAvg1)) -
    recentInFlightLeases;
  const cpuLimit = Math.max(FLOOR_MINIMUM, rawCpuLimit);

  if (job.peakMB === null || job.peakMB <= 0) {
    return loadCapacitySuggestionContract.parse({
      suggestion: cpuLimit,
      cpuLimit,
      freeMemoryLimit: null,
      capMemoryLimit: null,
    });
  }

  const startingLeasesPeak = liveLeases
    .filter((lease) => lease.state === 'starting')
    .reduce((sum, lease) => sum + (lease.expectedPeakMB ?? 0), 0);

  const availableFreeMB =
    machine.freeMemMB - loadBalancerStatics.memory.headroomMB - startingLeasesPeak;
  const freeMemoryLimit = Math.max(FLOOR_MINIMUM, Math.floor(availableFreeMB / job.peakMB));

  const totalCapMB = (machine.totalMemMB * maxMemoryPercent) / PERCENT_DIVISOR;
  const liveLeasesUsage = liveLeases.reduce(
    (sum, lease) => sum + (lease.currentRssMB ?? lease.expectedPeakMB ?? 0),
    0,
  );

  const availableCapMB = totalCapMB - liveLeasesUsage;
  const capMemoryLimit = Math.max(FLOOR_MINIMUM, Math.floor(availableCapMB / job.peakMB));

  const candidateLimits = [cpuLimit, freeMemoryLimit, capMemoryLimit];
  const suggestion = Math.max(FLOOR_MINIMUM, Math.min(...candidateLimits));

  return loadCapacitySuggestionContract.parse({
    suggestion,
    cpuLimit,
    freeMemoryLimit,
    capMemoryLimit,
  });
};

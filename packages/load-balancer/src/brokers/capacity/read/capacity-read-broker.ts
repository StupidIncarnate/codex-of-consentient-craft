/**
 * PURPOSE: Coordinates reading host machine limits, current hardware readings, and live leases
 * to compute recommended concurrency capacity suggestions for execution workloads.
 *
 * USAGE:
 * const capacity = await capacityReadBroker({ diskPath: '/path/to/disk', job: { peakMB: 512 } });
 * // Returns { suggestion, machine, liveLeases, resources, warnings }
 */

import type { Lease } from '../../../contracts/lease/lease-contract';
import type { LoadCapacitySuggestion } from '../../../contracts/load-capacity-suggestion/load-capacity-suggestion-contract';
import type { MachineReading } from '../../../contracts/machine-reading/machine-reading-contract';
import { capacitySuggestTransformer } from '../../../transformers/capacity-suggest/capacity-suggest-transformer';
import { leaseListLiveBroker } from '../../lease/list-live/lease-list-live-broker';
import { limitsReadBroker } from '../../limits/read/limits-read-broker';
import { machineReadBroker } from '../../machine/read/machine-read-broker';

export const capacityReadBroker = async ({
  diskPath,
  job,
}: {
  diskPath: string;
  job?: { peakMB: number | null };
}): Promise<{
  suggestion: LoadCapacitySuggestion;
  machine: MachineReading;
  liveLeases: readonly Lease[];
  resources: {
    maxMemoryPercent: number;
    maxCpuPercent: number;
    maxDiskMB: number;
  };
  warnings: readonly string[];
}> => {
  const { resources, warning: limitsWarning } = await limitsReadBroker();
  const machine = await machineReadBroker({ diskPath });

  let liveLeases: readonly Lease[] = [];
  let leaseWarning: string | null = null;

  try {
    liveLeases = await leaseListLiveBroker();
  } catch (error: unknown) {
    leaseWarning = error instanceof Error ? error.message : String(error);
  }

  const suggestion = capacitySuggestTransformer({
    machine,
    liveLeases,
    job: job ?? { peakMB: null },
    maxMemoryPercent: resources.maxMemoryPercent,
    maxCpuPercent: resources.maxCpuPercent,
  });

  const warnings: string[] = [];
  if (limitsWarning !== null) {
    warnings.push(limitsWarning);
  }
  if (leaseWarning !== null) {
    warnings.push(leaseWarning);
  }

  return {
    suggestion,
    machine,
    liveLeases,
    resources,
    warnings,
  };
};

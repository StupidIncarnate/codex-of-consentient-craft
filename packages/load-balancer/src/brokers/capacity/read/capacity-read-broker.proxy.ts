/**
 * PURPOSE: Proxy for capacity-read-broker that stages machine limits, machine readings,
 * and live leases dependencies via registerMock.
 *
 * USAGE:
 * const proxy = capacityReadBrokerProxy();
 * proxy.setupDefaults({ diskPath: '/test/disk' });
 * proxy.setupLimits({ warning: 'config unparseable' });
 * proxy.setupLeasesFailure({ error: 'sqlite locked' });
 */

import { machineResourcesStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { LeaseStub } from '../../../contracts/lease/lease.stub';
import { MachineReadingStub } from '../../../contracts/machine-reading/machine-reading.stub';
import { leaseListLiveBroker } from '../../lease/list-live/lease-list-live-broker';
import { leaseListLiveBrokerProxy } from '../../lease/list-live/lease-list-live-broker.proxy';
import { limitsReadBroker } from '../../limits/read/limits-read-broker';
import { limitsReadBrokerProxy } from '../../limits/read/limits-read-broker.proxy';
import { machineReadBroker } from '../../machine/read/machine-read-broker';
import { machineReadBrokerProxy } from '../../machine/read/machine-read-broker.proxy';

type Lease = ReturnType<typeof LeaseStub>;
type MachineReading = ReturnType<typeof MachineReadingStub>;

export const capacityReadBrokerProxy = (): {
  setupLimits: (params?: {
    resources?: { maxMemoryPercent: number; maxCpuPercent?: number; maxDiskMB: number };
    guildPaths?: readonly string[];
    warning?: string | null;
  }) => void;
  setupMachine: (params: { diskPath: string; machine?: MachineReading }) => void;
  setupLeases: (params?: { leases?: readonly Lease[] }) => void;
  setupLeasesFailure: (params: { error: Error | string }) => void;
  setupDefaults: (params?: {
    diskPath?: string;
    machine?: MachineReading;
    leases?: readonly Lease[];
    resources?: { maxMemoryPercent: number; maxCpuPercent?: number; maxDiskMB: number };
    warning?: string | null;
  }) => void;
  setupThrows: (params: { error: Error | string }) => void;
} => {
  leaseListLiveBrokerProxy();
  limitsReadBrokerProxy();
  machineReadBrokerProxy();

  const limitsHandle = registerMock({ fn: limitsReadBroker });
  const machineHandle = registerMock({ fn: machineReadBroker });
  const leaseHandle = registerMock({ fn: leaseListLiveBroker });

  const setupLimits = (params?: {
    resources?: { maxMemoryPercent: number; maxCpuPercent?: number; maxDiskMB: number };
    guildPaths?: readonly string[];
    warning?: string | null;
  }): void => {
    limitsHandle.calledWith([]).resolves({
      resources: {
        maxMemoryPercent:
          params?.resources?.maxMemoryPercent ?? machineResourcesStatics.maxMemoryPercent.default,
        maxCpuPercent:
          params?.resources?.maxCpuPercent ?? machineResourcesStatics.maxCpuPercent.default,
        maxDiskMB: params?.resources?.maxDiskMB ?? machineResourcesStatics.maxDiskMB.default,
      },
      guildPaths: params?.guildPaths ?? [],
      warning: params?.warning ?? null,
    });
  };

  const setupMachine = ({
    diskPath,
    machine,
  }: {
    diskPath: string;
    machine?: MachineReading;
  }): void => {
    machineHandle.calledWith([{ diskPath }]).resolves(machine ?? MachineReadingStub());
  };

  const setupLeases = (params?: { leases?: readonly Lease[] }): void => {
    leaseHandle.calledWith([]).resolves(params?.leases ?? []);
  };

  const setupLeasesFailure = ({ error }: { error: Error | string }): void => {
    leaseHandle.calledWith([]).rejects(error);
  };

  const setupDefaults = (params?: {
    diskPath?: string;
    machine?: MachineReading;
    leases?: readonly Lease[];
    resources?: { maxMemoryPercent: number; maxDiskMB: number };
    warning?: string | null;
  }): void => {
    setupLimits({
      ...(params?.resources === undefined ? {} : { resources: params.resources }),
      ...(params?.warning === undefined ? {} : { warning: params.warning }),
    });
    setupMachine({
      diskPath: params?.diskPath ?? '/test/disk',
      ...(params?.machine === undefined ? {} : { machine: params.machine }),
    });
    setupLeases({
      ...(params?.leases === undefined ? {} : { leases: params.leases }),
    });
  };

  const setupThrows = ({ error }: { error: Error | string }): void => {
    limitsHandle.calledWith([]).rejects(error);
  };

  return {
    setupLimits,
    setupMachine,
    setupLeases,
    setupLeasesFailure,
    setupThrows,
    setupDefaults,
  };
};

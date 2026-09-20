/**
 * PURPOSE: Composes `machineReadBroker`, the direct `registryReadBroker()` call `statusReadBroker`
 * makes for a fleet listing, `instanceStateResolveBroker` (used both per fleet row and for a named
 * query), and the ONE `instanceEntryLayerBrokerProxy` every row is assembled through — behind
 * scenario methods a test calls in the SAME order `statusReadBroker` reaches them:
 * `setupRegistryResolution` (the direct call, `{}` only) and `setupInstanceStateResolution` once per
 * instance either way, THEN `setupMachineReading`, THEN the spread-in `instanceEntryLayerBrokerProxy`
 * methods once per instance — `statusReadBroker` calls `machineReadBroker` after every instance's
 * state is resolved but BEFORE assembling any instance's row, and `machineOomCountBroker`'s own
 * `/proc` + `vmstat` join is explicitly staged (inside `machineOomCountBrokerProxy`) for exactly
 * this reason: composed here, it runs in between two OTHER sets of pending path resolutions on the
 * same shared mock, so an unstaged join would consume one of those instead of computing its own
 * real path.
 * The single `instanceEntryLayerBrokerProxy` created here is reused across every fleet row: its own
 * child mocks are all argument- or value-addressed, so calling its setup methods several times with
 * different instance data pushes one more round of entries rather than colliding with the previous
 * instance's. Its methods are spread into this proxy's own return value, rather than exposed as a
 * nested child object, per this repo's proxy-encapsulation rule.
 *
 * USAGE:
 * const proxy = statusReadBrokerProxy();
 * proxy.setupRegistryResolution({ registry });           // the direct call, for {}
 * proxy.setupInstanceStateResolution({ registry });      // once more per instance resolved
 * proxy.setupMachineReading({ freeMemBytes, totalMemBytes, coreCount, loadAvg, diskBavail, diskBsize, vmstatContent });
 * proxy.setupEvidenceDir({ ... });                       // once per instance row, AFTER machine
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import { instanceStateResolveBrokerProxy } from '../../instance/state-resolve/instance-state-resolve-broker.proxy';
import { machineReadBrokerProxy } from '../../machine/read/machine-read-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { instanceEntryLayerBrokerProxy } from './instance-entry-layer-broker.proxy';

type Registry = ReturnType<typeof RegistryStub>;

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const statusReadBrokerProxy = (): {
  setupRegistryResolution: (params: { registry: Registry }) => void;
  setupInstanceStateResolution: (params: { registry: Registry }) => void;
  setupNow: (params: { nowMs: number }) => void;
  setupMachineReading: (params: {
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
} & ReturnType<typeof instanceEntryLayerBrokerProxy> => {
  const registryProxy = registryReadBrokerProxy();
  const stateProxy = instanceStateResolveBrokerProxy();
  const machineProxy = machineReadBrokerProxy();
  const entryProxy = instanceEntryLayerBrokerProxy();
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    // registryReadBroker resolves home -> siegelense root -> registry.json fresh on every call, and
    // every one of those three values is the same fixed constant regardless of which real call
    // consumes it — so staging it once per real DIRECT call the broker makes is enough.
    setupRegistryResolution: ({ registry }: { registry: Registry }): void => {
      registryProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
    },

    // instanceStateResolveBroker reads the SAME registry.json again to resolve one row's state —
    // once per instance the broker resolves, fleet or named.
    setupInstanceStateResolution: ({ registry }: { registry: Registry }): void => {
      stateProxy.setupRegistry({ registry });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },

    setupMachineReading: (params: {
      freeMemBytes: number;
      totalMemBytes: number;
      coreCount: number;
      loadAvg: readonly [number, number, number];
      diskBavail: number;
      diskBsize: number;
      vmstatContent: string;
    }): void => {
      machineProxy.setupMachineReading({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        ...params,
      });
    },

    ...entryProxy,
  };
};

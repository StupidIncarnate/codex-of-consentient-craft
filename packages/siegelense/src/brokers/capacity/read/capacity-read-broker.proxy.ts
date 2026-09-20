/**
 * PURPOSE: Composes the three reads `capacityReadBroker` makes, behind scenario methods a test calls
 * in the SAME order the broker reaches them — `setupRegistry`, then `setupMachineReading`, then
 * `setupProfile`, then `setupNow`. `registryReadBroker` and `machineReadBroker` run REAL down to
 * their own adapters, and each queues its own one-shot path resolutions onto the shared
 * `pathJoinAdapter`, so calling the two setups out of order hands the wrong resolution to the wrong
 * caller (`statusReadBrokerProxy` documents the same hazard for the same two brokers).
 *
 * `profileReadBroker` is mocked DIRECTLY rather than composed, matching
 * `SiegelenseProfileResponderProxy`: a profile tree costs one staged readdir plus one staged read
 * per record, and every one of them competes for that same join queue — while the thing under test
 * here is which SAMPLE GROUP the arithmetic divides by, which a staged `SpecProfile` states
 * outright. `profileReadBrokerProxy` is still constructed to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = capacityReadBrokerProxy();
 * proxy.setupRegistry({ registry });
 * proxy.setupMachineReading({ freeMemBytes, totalMemBytes, coreCount, loadAvg, diskBavail, diskBsize, vmstatContent });
 * proxy.setupProfile({ profile });
 * proxy.setupNow({ nowMs });
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { machineReadBrokerProxy } from '../../machine/read/machine-read-broker.proxy';
import { profileReadBroker } from '../../profile/read/profile-read-broker';
import { profileReadBrokerProxy } from '../../profile/read/profile-read-broker.proxy';
import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';

type Registry = ReturnType<typeof RegistryStub>;
type SpecProfile = ReturnType<typeof SpecProfileStub>;

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

export const capacityReadBrokerProxy = (): {
  setupRegistry: (params: { registry: Registry }) => void;
  setupMachineReading: (params: {
    freeMemBytes: number;
    totalMemBytes: number;
    coreCount: number;
    loadAvg: readonly [number, number, number];
    diskBavail: number;
    diskBsize: number;
    vmstatContent: string;
  }) => void;
  setupProfile: (params: { profile: SpecProfile }) => void;
  setupNow: (params: { nowMs: number }) => void;
} => {
  const registryProxy = registryReadBrokerProxy();
  const machineProxy = machineReadBrokerProxy();
  // Constructed for enforce-proxy-child-creation only — the broker below is staged directly.
  profileReadBrokerProxy();
  const profileHandle = registerMock({ fn: profileReadBroker });
  const nowHandle = registerSpyOn({ object: Date, method: 'now' });

  return {
    setupRegistry: ({ registry }: { registry: Registry }): void => {
      registryProxy.setupPresentRegistry({ content: JSON.stringify(registry) });
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

    setupProfile: ({ profile }: { profile: SpecProfile }): void => {
      profileHandle.calledWith([]).resolves(profile);
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      nowHandle.calledWith([]).returns(nowMs);
    },
  };
};

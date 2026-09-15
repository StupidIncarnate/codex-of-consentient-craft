/**
 * PURPOSE: Test proxy for SiegelenseFleetResponder — mocks registryReadBroker,
 * locationsInstanceEvidencePathFindBroker and locationsRepoLinkPathFindBroker directly rather than
 * composing their own child proxies' STAGING, since each already carries its own dedicated test
 * suite and composing two independent `pathJoinAdapter`-staging proxies at once would collide on
 * that shared, argument-less catch-all. Their own proxies are still constructed (never addressed
 * further) to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseFleetResponderProxy();
 * proxy.stageInstance({ entry, evidence });
 */

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { locationsInstanceEvidencePathFindBroker } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsInstanceEvidencePathFindBrokerProxy } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker.proxy';
import { locationsRepoLinkPathFindBroker } from '../../../brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { locationsRepoLinkPathFindBrokerProxy } from '../../../brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy';
import { registryReadBroker } from '../../../brokers/registry/read/registry-read-broker';
import { registryReadBrokerProxy } from '../../../brokers/registry/read/registry-read-broker.proxy';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import type { RepoLocalPath } from '../../../contracts/repo-local-path/repo-local-path-contract';

export const SiegelenseFleetResponderProxy = (): {
  stageEmptyRegistry: () => void;
  stageInstance: (params: { entry: RegistryEntry; evidence: RepoLocalPath }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages registryReadBroker,
  // locationsInstanceEvidencePathFindBroker and locationsRepoLinkPathFindBroker directly below,
  // never through these children's own setup methods.
  registryReadBrokerProxy();
  locationsInstanceEvidencePathFindBrokerProxy();
  locationsRepoLinkPathFindBrokerProxy();

  const registryReadHandle = registerMock({ fn: registryReadBroker });
  const evidencePathHandle = registerMock({ fn: locationsInstanceEvidencePathFindBroker });
  const repoLinkHandle = registerMock({ fn: locationsRepoLinkPathFindBroker });

  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageEmptyRegistry: (): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [] });
    },

    stageInstance: ({
      entry,
      evidence,
    }: {
      entry: RegistryEntry;
      evidence: RepoLocalPath;
    }): void => {
      registryReadHandle.calledWith([]).resolves({ instances: [entry] });
      evidencePathHandle
        .calledWith([])
        .returns(AbsoluteFilePathStub({ value: '/tmp/dm-siege-fleet-test' }));
      repoLinkHandle.calledWith([]).resolves(evidence);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};

/**
 * PURPOSE: Test proxy for SiegelenseProfileResponder — mocks `profileReadBroker` directly rather than
 * composing its own child proxies' staging, matching `SiegelenseStatusResponderProxy`'s shape for the
 * sibling command. `profileReadBrokerProxy` is still constructed (never addressed further) to satisfy
 * `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseProfileResponderProxy();
 * proxy.stageProfile({ profile });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { profileReadBroker } from '../../../brokers/profile/read/profile-read-broker';
import { profileReadBrokerProxy } from '../../../brokers/profile/read/profile-read-broker.proxy';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';

type SpecProfile = ReturnType<typeof SpecProfileStub>;

export const SiegelenseProfileResponderProxy = (): {
  stageProfile: (params: { profile: SpecProfile }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages profileReadBroker
  // directly below, never through its own setup methods.
  profileReadBrokerProxy();

  const profileReadHandle = registerMock({ fn: profileReadBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageProfile: ({ profile }: { profile: SpecProfile }): void => {
      profileReadHandle.calledWith([]).resolves(profile);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};

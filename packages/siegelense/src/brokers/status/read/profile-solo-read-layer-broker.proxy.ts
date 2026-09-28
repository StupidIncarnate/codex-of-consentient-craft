/**
 * PURPOSE: Mocks `profileReadBroker` DIRECTLY for `profileSoloReadLayerBroker`'s own tests — the
 * same choice `capacityReadBrokerProxy` makes for the same broker, and for the same reason: what
 * this broker's tests measure is which sample group `capacitySampleSelectTransformer` picks, which
 * a staged `SpecProfile` states outright, never the path-join queue a real profile tree competes on.
 *
 * USAGE:
 * const proxy = profileSoloReadLayerBrokerProxy();
 * proxy.setupProfile({ profile });
 * proxy.setupProfileReadFails({ error });
 */

import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { profileReadBroker } from '../../profile/read/profile-read-broker';
import { profileReadBrokerProxy } from '../../profile/read/profile-read-broker.proxy';

type SpecProfile = ReturnType<typeof SpecProfileStub>;

export const profileSoloReadLayerBrokerProxy = (): {
  setupProfile: (params: { profile: SpecProfile }) => void;
  setupProfileReadFails: (params: { error: Error }) => void;
  getStderrMessages: () => readonly ContentText[];
} => {
  // Constructed for enforce-proxy-child-creation only — the broker below is staged directly.
  profileReadBrokerProxy();
  const profileHandle = registerMock({ fn: profileReadBroker });
  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrHandle.calledWith([]).returns(true);

  return {
    setupProfile: ({ profile }: { profile: SpecProfile }): void => {
      profileHandle.calledWith([]).resolves(profile);
    },

    setupProfileReadFails: ({ error }: { error: Error }): void => {
      profileHandle.calledWith([]).rejects(error);
    },

    getStderrMessages: (): readonly ContentText[] =>
      stderrHandle.callsMatching([]).map((call) => ContentTextStub({ value: String(call[0]) })),
  };
};

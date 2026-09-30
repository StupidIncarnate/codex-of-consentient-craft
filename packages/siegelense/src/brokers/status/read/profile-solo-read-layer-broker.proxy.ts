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

import { registerMock } from '@dungeonmaster/testing/register-mock';

import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';
import { profileReadBroker } from '../../profile/read/profile-read-broker';
import { profileReadBrokerProxy } from '../../profile/read/profile-read-broker.proxy';

type SpecProfile = ReturnType<typeof SpecProfileStub>;
type SpecName = string;

export const profileSoloReadLayerBrokerProxy = (): {
  setupProfile: (params: { profile: SpecProfile }) => void;
  setupProfileReadFails: (params: { error: Error; specName: SpecName }) => void;
  getStderrMessages: () => readonly string[];
} => {
  // Constructed for enforce-proxy-child-creation only — the broker below is staged directly.
  profileReadBrokerProxy();
  const profileHandle = registerMock({ fn: profileReadBroker });
  const stderr = stderrProxy();

  return {
    setupProfile: ({ profile }: { profile: SpecProfile }): void => {
      profileHandle.calledWith([{ specName: profile.specName }]).resolves(profile);
    },

    setupProfileReadFails: ({ error, specName }: { error: Error; specName: SpecName }): void => {
      profileHandle.calledWith([{ specName }]).rejects(error);
    },

    getStderrMessages: (): readonly string[] => stderr.getWrites().map((chunk) => String(chunk)),
  };
};

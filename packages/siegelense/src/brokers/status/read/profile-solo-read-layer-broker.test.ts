import { SpecProfileStub } from '../../../contracts/spec-profile/spec-profile.stub';

import { profileSoloReadLayerBroker } from './profile-solo-read-layer-broker';
import { profileSoloReadLayerBrokerProxy } from './profile-solo-read-layer-broker.proxy';

describe('profileSoloReadLayerBroker', () => {
  describe('a spec measured solo (pool size 1)', () => {
    it('VALID: {samples include pool size 1} => returns that group as a CapacityProfile', async () => {
      const proxy = profileSoloReadLayerBrokerProxy();
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'stack',
          samples: [
            { poolSize: 1, steadyMB: 488, peakMB: 609, runs: 5 },
            { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 2 },
          ],
        }),
      });

      const result = await profileSoloReadLayerBroker({
        specName: 'stack',
      });

      expect(result).toStrictEqual({
        spec: 'stack',
        poolSize: 1,
        steadyMB: 488,
        peakMB: 609,
        fromRuns: 5,
      });
    });
  });

  describe('a spec measured only at a contended pool size', () => {
    it('VALID: {samples hold pool size 3 only} => falls back to the nearest measured group, the pessimistic direction', async () => {
      const proxy = profileSoloReadLayerBrokerProxy();
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'stack',
          samples: [{ poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 2 }],
        }),
      });

      const result = await profileSoloReadLayerBroker({
        specName: 'stack',
      });

      expect(result).toStrictEqual({
        spec: 'stack',
        poolSize: 3,
        steadyMB: 1920,
        peakMB: 2810,
        fromRuns: 2,
      });
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {samples: []} => returns null', async () => {
      const proxy = profileSoloReadLayerBrokerProxy();
      proxy.setupProfile({
        profile: SpecProfileStub({
          specName: 'stack',
          samples: [],
          fromRuns: 0,
          measuredAt: null,
          bootMs: null,
        }),
      });

      const result = await profileSoloReadLayerBroker({
        specName: 'stack',
      });

      expect(result).toBe(null);
    });
  });

  describe('the profile read itself fails', () => {
    it('ERROR: {profileReadBroker rejects} => returns null and logs the failure instead of throwing', async () => {
      const proxy = profileSoloReadLayerBrokerProxy();
      proxy.setupProfileReadFails({
        specName: 'ghost',
        error: new Error('Unknown lane spec "ghost". Known specs: stack, api'),
      });

      const result = await profileSoloReadLayerBroker({
        specName: 'ghost',
      });

      expect(result).toBe(null);
      expect(proxy.getStderrMessages()).toStrictEqual([
        '[profile-solo-read] could not read the profile for spec ghost: Error: Unknown lane spec "ghost". Known specs: stack, api\n',
      ]);
    });
  });
});

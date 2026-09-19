import { capacityAnswerContract } from './capacity-answer-contract';
import { CapacityAnswerStub } from './capacity-answer.stub';

describe('capacityAnswerContract', () => {
  describe('a measured answer', () => {
    it("VALID: {the spec's own worked answer} => parses every block through", () => {
      const result = capacityAnswerContract.parse(CapacityAnswerStub());

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why:
          'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; 1 siege instance already up',
        measured: {
          freeMemMB: 5320,
          cores: 8,
          loadAvg1: 4.2,
          siegeInstances: 1,
          diskFreeMB: 41_000,
        },
        profile: {
          spec: 'dungeonmaster-stack',
          poolSize: 1,
          steadyMB: 1800,
          peakMB: 2600,
          fromRuns: 9,
        },
      });
    });
  });

  describe('a spec nothing has ever run', () => {
    it('EMPTY: {profile: null} => parses, because the default pair is a real answer', () => {
      const result = capacityAnswerContract.parse(
        CapacityAnswerStub({
          suggested: 2,
          profile: null,
          why: 'no measured profile for dungeonmaster-stack, so the default pair of 2 profiles itself',
        }),
      );

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        why: 'no measured profile for dungeonmaster-stack, so the default pair of 2 profiles itself',
        measured: {
          freeMemMB: 5320,
          cores: 8,
          loadAvg1: 4.2,
          siegeInstances: 1,
          diskFreeMB: 41_000,
        },
        profile: null,
      });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {suggested: -1} => throws, a suggestion is never negative', () => {
      expect(() => CapacityAnswerStub({ suggested: -1 })).toThrow(/greater than or equal to 0/iu);
    });

    it('INVALID: {an extra reserved key} => throws, the answer is strict', () => {
      expect(() => CapacityAnswerStub({ reserved: 1 } as never)).toThrow(/unrecognized key/iu);
    });
  });
});

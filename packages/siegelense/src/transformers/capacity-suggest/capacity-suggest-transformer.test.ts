import { CapacityProfileStub } from '../../contracts/capacity-profile/capacity-profile.stub';
import { MegabytesStub } from '../../contracts/megabytes/megabytes.stub';
import { ReadingCountStub } from '../../contracts/reading-count/reading-count.stub';

import { capacitySuggestTransformer } from './capacity-suggest-transformer';

describe('capacitySuggestTransformer', () => {
  describe("the spec's own worked example", () => {
    it('VALID: {free 5320MB, peak 2600, steady 1800, 1 instance up} => suggested 2 against a ceiling of 3', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        freeMemMB: MegabytesStub({ value: 5320 }),
        siegeInstances: ReadingCountStub({ value: 1 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 2,
        availableMB: 4808,
      });
    });
  });

  describe('the staggered inversion', () => {
    it('VALID: {available exactly peak} => memoryAllows 1, the one instance at its own peak', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 3112 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 1,
        ceiling: 3,
        memoryAllows: 1,
        ceilingLeft: 3,
        availableMB: 2600,
      });
    });

    it('EDGE: {available one MB under peak} => memoryAllows 0, the machine plainly cannot hold another', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 3111 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 0,
        ceilingLeft: 3,
        availableMB: 2599,
      });
    });

    it('VALID: {available peak + 2 x steady} => memoryAllows 3, never the 2 that peak x N would give', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 6712 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 3,
        ceiling: 3,
        memoryAllows: 3,
        ceilingLeft: 3,
        availableMB: 6200,
      });
    });
  });

  describe('the policy ceiling', () => {
    it('VALID: {plenty of memory, empty fleet} => suggested clamped to the ceiling of 3', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 64_000 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 3,
        ceiling: 3,
        memoryAllows: 34,
        ceilingLeft: 3,
        availableMB: 63_488,
      });
    });

    it('EDGE: {3 instances already up} => suggested 0 from the ceiling while memory still allows 34', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 64_000 }),
        siegeInstances: ReadingCountStub({ value: 3 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 34,
        ceilingLeft: 0,
        availableMB: 63_488,
      });
    });

    it('EDGE: {5 instances already up, past the ceiling} => ceilingLeft floors at 0, never negative', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 64_000 }),
        siegeInstances: ReadingCountStub({ value: 5 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 34,
        ceilingLeft: 0,
        availableMB: 63_488,
      });
    });
  });

  describe('reservations still booting', () => {
    it("VALID: {1 reservation} => its peak is debited, so suggested drops below the same machine's idle answer", () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 8000 }),
        siegeInstances: ReadingCountStub({ value: 1 }),
        reservedInstances: ReadingCountStub({ value: 1 }),
      });

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 2,
        availableMB: 4888,
      });
    });

    it('EDGE: {2 reservations against thin memory} => availableMB floors at 0 rather than going negative', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 1800, peakMB: 2600 }),
        freeMemMB: MegabytesStub({ value: 3000 }),
        siegeInstances: ReadingCountStub({ value: 2 }),
        reservedInstances: ReadingCountStub({ value: 2 }),
      });

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 0,
        ceilingLeft: 1,
        availableMB: 0,
      });
    });
  });

  describe('no measured profile', () => {
    it('EMPTY: {profile: null, empty fleet} => suggested 2, the pair that profiles itself', () => {
      const result = capacitySuggestTransformer({
        profile: null,
        freeMemMB: MegabytesStub({ value: 5320 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 3,
        availableMB: 4808,
      });
    });

    it('EMPTY: {profile: null, thin memory} => memoryAllows stays 2, so nothing refuses on an absence', () => {
      const result = capacitySuggestTransformer({
        profile: null,
        freeMemMB: MegabytesStub({ value: 100 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 2,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 3,
        availableMB: 0,
      });
    });

    it('EDGE: {profile: null, ceiling already full} => suggested 0, the one way the default refuses', () => {
      const result = capacitySuggestTransformer({
        profile: null,
        freeMemMB: MegabytesStub({ value: 64_000 }),
        siegeInstances: ReadingCountStub({ value: 3 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 0,
        ceiling: 3,
        memoryAllows: 2,
        ceilingLeft: 0,
        availableMB: 63_488,
      });
    });
  });

  describe('a group with no settled beat', () => {
    it('EDGE: {steadyMB: 0, peakMB: 0} => divides by one megabyte rather than yielding Infinity', () => {
      const result = capacitySuggestTransformer({
        profile: CapacityProfileStub({ steadyMB: 0, peakMB: 0 }),
        freeMemMB: MegabytesStub({ value: 514 }),
        siegeInstances: ReadingCountStub({ value: 0 }),
        reservedInstances: ReadingCountStub({ value: 0 }),
      });

      expect(result).toStrictEqual({
        suggested: 3,
        ceiling: 3,
        memoryAllows: 3,
        ceilingLeft: 3,
        availableMB: 2,
      });
    });
  });
});

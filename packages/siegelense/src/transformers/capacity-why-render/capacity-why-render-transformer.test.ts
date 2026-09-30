import { CapacityMeasuredStub } from '../../contracts/capacity-measured/capacity-measured.stub';
import { CapacityProfileStub } from '../../contracts/capacity-profile/capacity-profile.stub';
import { CapacitySuggestionStub } from '../../contracts/capacity-suggestion/capacity-suggestion.stub';

import { capacityWhyRenderTransformer } from './capacity-why-render-transformer';

// `CapacitySuggestionStub`'s own default (cpuAllows: 6) never wins against these tests' fixtures —
// the policy ceiling never exceeds 3, so a default of 6 can never satisfy `cpuAllows <=
// ceilingLeft`. These display figures only matter for the CPU-specific describe block below, where
// each test sets its own.
const { cores: SOME_CORES, loadAvg1: SOME_LOAD1 } = CapacityMeasuredStub();

describe('capacityWhyRenderTransformer', () => {
  describe("the spec's own three clauses", () => {
    it('VALID: {measured profile, 1 instance up} => names the peak, the steady, the free RAM, the headroom and the instance', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 1,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          '1 siege instance already up',
      );
    });

    it('EMPTY: {nothing up} => the third clause says nothing else is up rather than naming zero instances', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 3,
          memoryAllows: 3,
          ceilingLeft: 3,
          availableMB: 6200,
        }),
        freeMemMB: 6712,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 6712MB less 512MB headroom; ' +
          'nothing else up',
      );
    });

    it('VALID: {2 instances up} => pluralises the third clause', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 3, steadyMB: 1920, peakMB: 2810, fromRuns: 5 }),
        suggestion: CapacitySuggestionStub({
          suggested: 1,
          memoryAllows: 1,
          ceilingLeft: 1,
          availableMB: 2900,
        }),
        freeMemMB: 3412,
        siegeInstances: 2,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2810MB peak / 1920MB steady at pool size 3, from 5 runs; ' +
          'free RAM 3412MB less 512MB headroom; ' +
          '2 siege instances already up',
      );
    });
  });

  describe('reservations still booting', () => {
    it('VALID: {1 reservation} => the memory clause names the debited peak and the third clause names the reservation', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4888,
        }),
        freeMemMB: 8000,
        siegeInstances: 1,
        reservedInstances: 1,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 8000MB less 512MB headroom and 2600MB for 1 still booting; ' +
          '1 siege instance already up (1 still reserving)',
      );
    });
  });

  describe('no measured profile', () => {
    it('EMPTY: {profile: null, --pool omitted} => the first clause names the spec, the default, and how to record a profile', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-api',
        profile: null,
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 3,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'no measured profile for dungeonmaster-api, so this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          'nothing else up',
      );
    });

    it('VALID: {profile: null, --pool 5} => names --pool as having no effect, since nothing was measured to pick a group from', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-api',
        profile: null,
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 3,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: 5,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'no measured profile for dungeonmaster-api, so --pool 5 has no effect: this suggests the default of 2 instances; ' +
          'run a pool of 2 once and siegelense records a profile for next time; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          'nothing else up',
      );
    });
  });

  describe('a requested pool size against a measured profile', () => {
    it('VALID: {--pool matches the profile group} => no extra clause, the requested and used pool sizes already agree', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 1,
        reservedInstances: 0,
        requestedPoolSize: 1,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          '1 siege instance already up',
      );
    });

    it('EDGE: {--pool 99999, no group that large} => names which pool size the profile block actually used', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 1,
        reservedInstances: 0,
        requestedPoolSize: 99_999,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          '--pool 99999 has no measured group, so pool size 1 was used instead; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          '1 siege instance already up',
      );
    });
  });

  describe('the limiting clause', () => {
    it('EDGE: {memoryAllows: 0} => names the available memory against the peak, the hard case', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 0,
          memoryAllows: 0,
          ceilingLeft: 3,
          availableMB: 2599,
        }),
        freeMemMB: 3111,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 3111MB less 512MB headroom; ' +
          'nothing else up; ' +
          'no room for one more: 2599MB available is under the 2600MB this spec peaks at',
      );
    });

    it('EDGE: {ceilingLeft: 0, memory still fine} => names the full policy pool instead', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 0,
          memoryAllows: 34,
          ceilingLeft: 0,
          availableMB: 63_488,
        }),
        freeMemMB: 64_000,
        siegeInstances: 3,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 64000MB less 512MB headroom; ' +
          '3 siege instances already up; ' +
          'the policy pool of 3 is full',
      );
    });

    it('VALID: {memory allows more than the ceiling, CPU roomier still} => says the answer was capped by policy', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 3,
          memoryAllows: 34,
          ceilingLeft: 3,
          availableMB: 63_488,
        }),
        freeMemMB: 64_000,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 64000MB less 512MB headroom; ' +
          'nothing else up; ' +
          'capped at the policy ceiling of 3',
      );
    });

    it('VALID: {memory and ceiling agree} => no fourth clause at all', () => {
      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 2,
          memoryAllows: 2,
          ceilingLeft: 2,
          availableMB: 4808,
        }),
        freeMemMB: 5320,
        siegeInstances: 1,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores: SOME_CORES,
        loadAvg1: SOME_LOAD1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 5320MB less 512MB headroom; ' +
          '1 siege instance already up',
      );
    });
  });

  describe('CPU pressure', () => {
    it('EDGE: {load 33.56 across 12 cores, memory and ceiling roomy} => names load, cores and the throttled count instead of the ceiling', () => {
      const { cores, loadAvg1 } = CapacityMeasuredStub({ cores: 12, loadAvg1: 33.56 });

      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 1,
          memoryAllows: 34,
          cpuAllows: 1,
          ceilingLeft: 3,
          availableMB: 63_488,
        }),
        freeMemMB: 21_053,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores,
        loadAvg1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 21053MB less 512MB headroom; ' +
          'nothing else up; ' +
          'load 33.56 across 12 cores allows only 1; CPU, not memory, is the limit',
      );
    });

    it('EDGE: {cpuAllows ties the ceiling, both below memory} => credits CPU rather than the generic policy-cap wording', () => {
      const { cores, loadAvg1 } = CapacityMeasuredStub({ cores: 8, loadAvg1: 4.2 });

      const result = capacityWhyRenderTransformer({
        specName: 'dungeonmaster-stack',
        profile: CapacityProfileStub({ poolSize: 1, steadyMB: 1800, peakMB: 2600, fromRuns: 9 }),
        suggestion: CapacitySuggestionStub({
          suggested: 3,
          memoryAllows: 34,
          cpuAllows: 3,
          ceilingLeft: 3,
          availableMB: 63_488,
        }),
        freeMemMB: 9_000,
        siegeInstances: 0,
        reservedInstances: 0,
        requestedPoolSize: null,
        cores,
        loadAvg1,
      });

      expect(result).toBe(
        'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; ' +
          'free RAM 9000MB less 512MB headroom; ' +
          'nothing else up; ' +
          'load 4.2 across 8 cores allows only 3; CPU, not memory, is the limit',
      );
    });
  });
});

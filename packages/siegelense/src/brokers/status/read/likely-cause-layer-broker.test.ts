
import { CapacityProfileStub } from '../../../contracts/capacity-profile/capacity-profile.stub';
import { MegabytesStub } from '../../../contracts/megabytes/megabytes.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

import { likelyCauseLayerBroker } from './likely-cause-layer-broker';
import { likelyCauseLayerBrokerProxy } from './likely-cause-layer-broker.proxy';

describe('likelyCauseLayerBroker', () => {
  describe('a dead instance with a full reading, no profile ever recorded', () => {
    it('VALID: {memory 2980, no profile, 2 oom kills} => a sentence naming all three, in plain "memory" wording', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: MegabytesStub({ value: 2980 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
        shutdownReason: null,
        soloProfile: null,
      });

      expect(result).toBe(
        'memory 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 2',
      );
    });
  });

  describe('a dead instance with nothing measurable', () => {
    it('VALID: {memory null, oom null} => a sentence saying both are unavailable and claiming nothing', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: null,
        soloProfile: null,
      });

      expect(result).toBe('memory unavailable at last beat; kernel OOM events unavailable');
    });
  });

  describe('a killed instance, no profile ever recorded', () => {
    it('VALID: {state: killed, memory 1200} => a sentence naming the last measured memory', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'killed',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: MegabytesStub({ value: 1200 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
        shutdownReason: null,
        soloProfile: null,
      });

      expect(result).toBe(
        'memory 1200MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM kills since boot: 0',
      );
    });
  });

  describe('a dead instance whose spec DOES have a recorded solo profile', () => {
    it('VALID: {memory 609, a pool-1 profile of peak 609 / steady 488 from 5 runs} => the sentence quotes the profile instead of denying one exists', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'stack' }),
        rssAtLastBeat: MegabytesStub({ value: 609 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
        shutdownReason: null,
        soloProfile: CapacityProfileStub({
          spec: 'stack',
          poolSize: 1,
          steadyMB: 488,
          peakMB: 609,
          fromRuns: 5,
        }),
      });

      expect(result).toBe(
        'memory 609MB at last beat; profile 609MB peak / 488MB steady at pool size 1, from 5 runs; kernel OOM kills since boot: 0',
      );
    });

    it('VALID: {a profile measured only at a contended pool size} => still quotes it, naming the pool size actually measured', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'stack' }),
        rssAtLastBeat: MegabytesStub({ value: 2900 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
        shutdownReason: null,
        soloProfile: CapacityProfileStub({
          spec: 'stack',
          poolSize: 3,
          steadyMB: 1920,
          peakMB: 2810,
          fromRuns: 2,
        }),
      });

      expect(result).toBe(
        'memory 2900MB at last beat; profile 2810MB peak / 1920MB steady at pool size 3, from 2 runs; kernel OOM kills since boot: 1',
      );
    });
  });

  describe('a dead instance that recorded why it shut down', () => {
    it('VALID: {shutdownReason recorded, memory and oom also present} => the recorded reason IS the sentence, with no memory/OOM recital appended', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: MegabytesStub({ value: 622 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
        shutdownReason: 'reaped by idle timeout after 900s with no run received',
        soloProfile: null,
      });

      expect(result).toBe('reaped by idle timeout after 900s with no run received');
    });

    it('VALID: {state: killed, shutdownReason recorded} => the recorded reason IS the sentence', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'killed',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: 'reaped by idle timeout after 900s with no run received',
        soloProfile: null,
      });

      expect(result).toBe('reaped by idle timeout after 900s with no run received');
    });

    it('VALID: {shutdownReason recorded AND a solo profile exists} => the recorded reason still wins, the profile never enters the sentence', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'dead',
        specName: SpecNameStub({ value: 'stack' }),
        rssAtLastBeat: MegabytesStub({ value: 609 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
        shutdownReason: 'reaped by cleanup after its heartbeat went stale',
        soloProfile: CapacityProfileStub({
          spec: 'stack',
          poolSize: 1,
          steadyMB: 488,
          peakMB: 609,
          fromRuns: 5,
        }),
      });

      expect(result).toBe('reaped by cleanup after its heartbeat went stale');
    });
  });

  describe('a live instance', () => {
    it('VALID: {a live instance} => likelyCause is null, because nothing went wrong yet', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'alive',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
        shutdownReason: null,
        soloProfile: null,
      });

      expect(result).toBe(null);
    });

    it('VALID: {a live instance, shutdownReason somehow recorded} => likelyCause is still null', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'alive',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: 'reaped by idle timeout',
        soloProfile: null,
      });

      expect(result).toBe(null);
    });

    it('VALID: {a live instance, a solo profile somehow provided} => likelyCause is still null', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: 'alive',
        specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: null,
        soloProfile: CapacityProfileStub(),
      });

      expect(result).toBe(null);
    });
  });
});

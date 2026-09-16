import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceStateStub } from '../../../contracts/instance-state/instance-state.stub';
import { MegabytesStub } from '../../../contracts/megabytes/megabytes.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';

import { likelyCauseLayerBroker } from './likely-cause-layer-broker';
import { likelyCauseLayerBrokerProxy } from './likely-cause-layer-broker.proxy';

describe('likelyCauseLayerBroker', () => {
  describe('a dead instance with a full reading', () => {
    it('VALID: {rss 2980, no profile, 2 oom kills} => a sentence naming all three', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'dead' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: MegabytesStub({ value: 2980 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
        shutdownReason: null,
      });

      expect(result).toBe(
        'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 2',
      );
    });
  });

  describe('a dead instance with nothing measurable', () => {
    it('VALID: {rss null, oom null} => a sentence saying both are unavailable and claiming nothing', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'dead' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: null,
      });

      expect(result).toBe('rss unavailable at last beat; kernel OOM events unavailable');
    });
  });

  describe('a killed instance', () => {
    it('VALID: {state: killed, rss 1200} => a sentence naming the last measured rss', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'killed' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: MegabytesStub({ value: 1200 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 0 }),
        shutdownReason: null,
      });

      expect(result).toBe(
        'rss 1200MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 0',
      );
    });
  });

  describe('a dead instance that recorded why it shut down', () => {
    it('VALID: {shutdownReason recorded, rss and oom also present} => the recorded reason IS the sentence, with no RSS/OOM recital appended', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'dead' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: MegabytesStub({ value: 622 }),
        oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
        shutdownReason: ContentTextStub({
          value: 'reaped by idle timeout after 900s with no run received',
        }),
      });

      expect(result).toBe('reaped by idle timeout after 900s with no run received');
    });

    it('VALID: {state: killed, shutdownReason recorded} => the recorded reason IS the sentence', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'killed' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: ContentTextStub({
          value: 'reaped by idle timeout after 900s with no run received',
        }),
      });

      expect(result).toBe('reaped by idle timeout after 900s with no run received');
    });
  });

  describe('a live instance', () => {
    it('VALID: {a live instance} => likelyCause is null, because nothing went wrong yet', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'alive' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
        shutdownReason: null,
      });

      expect(result).toBe(null);
    });

    it('VALID: {a live instance, shutdownReason somehow recorded} => likelyCause is still null', () => {
      likelyCauseLayerBrokerProxy();

      const result = likelyCauseLayerBroker({
        state: InstanceStateStub({ value: 'alive' }),
        specName: SpecNameStub({ value: 'dungeonmaster-web' }),
        rssAtLastBeat: null,
        oomKillsSinceBoot: null,
        shutdownReason: ContentTextStub({ value: 'reaped by idle timeout' }),
      });

      expect(result).toBe(null);
    });
  });
});

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
      });

      expect(result).toBe(
        'rss 1200MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM kills since boot: 0',
      );
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
      });

      expect(result).toBe(null);
    });
  });
});

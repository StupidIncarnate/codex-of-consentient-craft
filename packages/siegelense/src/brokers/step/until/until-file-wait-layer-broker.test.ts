import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { UntilFilePathStub } from '../../../contracts/until-file-path/until-file-path.stub';
import { untilFileWaitLayerBroker } from './until-file-wait-layer-broker';
import { untilFileWaitLayerBrokerProxy } from './until-file-wait-layer-broker.proxy';

const HOME_PATH = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' });
const FILE = UntilFilePathStub({ value: 'guilds/g1/quests/q1/quest.json' });
const RESOLVED_PATH = AbsoluteFilePathStub({
  value: '/tmp/dm-siege-inst_1/guilds/g1/quests/q1/quest.json',
});

describe('untilFileWaitLayerBroker', () => {
  describe('the file is already there', () => {
    it('VALID: {file present, no elapsed time} => returns the reading naming 0ms', async () => {
      const proxy = untilFileWaitLayerBrokerProxy();
      proxy.fileAppears({ filePath: RESOLVED_PATH });
      proxy.stageElapsedMs({ nowMs: 0 });

      const reading = await untilFileWaitLayerBroker({
        homePath: HOME_PATH,
        file: FILE,
        startedAtMs: 0,
        deadlineAtMs: 10_000,
        timeoutMs: 10_000,
      });

      expect(reading).toBe('guilds/g1/quests/q1/quest.json appeared after 0ms');
    });

    it('VALID: {file present, 90ms already elapsed} => names the real elapsed time', async () => {
      const proxy = untilFileWaitLayerBrokerProxy();
      proxy.fileAppears({ filePath: RESOLVED_PATH });
      proxy.stageElapsedMs({ nowMs: 90 });

      const reading = await untilFileWaitLayerBroker({
        homePath: HOME_PATH,
        file: FILE,
        startedAtMs: 0,
        deadlineAtMs: 10_000,
        timeoutMs: 10_000,
      });

      expect(reading).toBe('guilds/g1/quests/q1/quest.json appeared after 90ms');
    });
  });

  describe('the ceiling is hit', () => {
    it('ERROR: {file never appears, deadline already passed} => throws UntilCeilingHitError naming the form and the ceiling', async () => {
      const proxy = untilFileWaitLayerBrokerProxy();
      proxy.fileNeverAppears({ filePath: RESOLVED_PATH });
      proxy.stageElapsedMs({ nowMs: 500 });

      const error = await untilFileWaitLayerBroker({
        homePath: HOME_PATH,
        file: FILE,
        startedAtMs: 0,
        deadlineAtMs: 500,
        timeoutMs: 10_000,
      }).then(
        (): never => {
          throw new Error('Expected untilFileWaitLayerBroker to reject');
        },
        (caught: unknown): Error => caught as Error,
      );

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'UntilCeilingHitError',
        message: 'file guilds/g1/quests/q1/quest.json never resolved in 10000ms',
      });
    });
  });
});

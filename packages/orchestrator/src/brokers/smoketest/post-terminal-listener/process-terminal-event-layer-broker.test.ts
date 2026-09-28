import {
  AbsoluteFilePathStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { processTerminalEventLayerBroker } from './process-terminal-event-layer-broker';
import { processTerminalEventLayerBrokerProxy } from './process-terminal-event-layer-broker.proxy';

describe('processTerminalEventLayerBroker', () => {
  it('VALID: {export shape} => is a function', () => {
    processTerminalEventLayerBrokerProxy();

    expect(processTerminalEventLayerBroker).toStrictEqual(expect.any(Function));
  });

  describe('quest deleted between event and handler', () => {
    it('VALID: {questFindQuestPathBroker throws not-found, entry has stopDriver} => stops driver, unregisters, returns success', async () => {
      const proxy = processTerminalEventLayerBrokerProxy();
      proxy.setupPassthrough();
      proxy.setupQuestDeleted({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
      });

      const stopDriver = jest.fn();
      const unregisterListener = jest.fn();
      const entry = SmoketestListenerEntryStub({ stopDriver });
      const scenarioMeta = SmoketestScenarioMetaStub();
      const questId = QuestIdStub({ value: 'q-deleted' });

      const result = await processTerminalEventLayerBroker({
        questId,
        entry,
        scenarioMeta,
        unregisterListener,
      });

      expect(result).toStrictEqual({ success: true });
      expect(stopDriver.mock.calls).toStrictEqual([[]]);
      expect(unregisterListener.mock.calls).toStrictEqual([[{ questId }]]);
    });

    it('VALID: {entry has no stopDriver and quest deleted} => still unregisters, returns success', async () => {
      const proxy = processTerminalEventLayerBrokerProxy();
      proxy.setupPassthrough();
      proxy.setupQuestDeleted({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
      });

      const unregisterListener = jest.fn();
      const entry = SmoketestListenerEntryStub();
      const scenarioMeta = SmoketestScenarioMetaStub();
      const questId = QuestIdStub({ value: 'q-deleted-no-driver' });

      const result = await processTerminalEventLayerBroker({
        questId,
        entry,
        scenarioMeta,
        unregisterListener,
      });

      expect(result).toStrictEqual({ success: true });
      expect(unregisterListener.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });

  describe('quest found, not yet terminal', () => {
    it('VALID: {quest status in_progress} => joins the found quest path with quest.json, not any other name', async () => {
      const proxy = processTerminalEventLayerBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'q-not-terminal' });
      const questPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/guilds/g1/quests/q-not-terminal',
      });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuestFound({ questId, questPath, quest });

      const entry = SmoketestListenerEntryStub();
      const scenarioMeta = SmoketestScenarioMetaStub();

      const result = await processTerminalEventLayerBroker({
        questId,
        entry,
        scenarioMeta,
        unregisterListener: jest.fn(),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getQuestFileJoinArgs({ questPath })).toStrictEqual([questPath, 'quest.json']);
    });
  });
});

import {
  GuildIdStub,
  QuestIdStub,
  QuestStatusStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questPauseBroker } from './quest-pause-broker';
import { questPauseBrokerProxy } from './quest-pause-broker.proxy';

const buildProcessControls = ({
  questIdMatch,
  kill,
}: {
  questIdMatch?: ReturnType<typeof QuestIdStub>;
  kill?: jest.Mock;
} = {}): {
  findByQuestId: jest.Mock;
  kill: jest.Mock;
} => {
  const killMock = kill ?? jest.fn();
  const findByQuestId =
    questIdMatch === undefined
      ? jest.fn().mockReturnValue(undefined)
      : jest
          .fn()
          .mockImplementation(({ questId }: { questId: ReturnType<typeof QuestIdStub> }) =>
            questId === questIdMatch
              ? { processId: 'proc-match', questId: questIdMatch, kill: killMock }
              : undefined,
          );
  return { findByQuestId, kill: killMock };
};

describe('questPauseBroker', () => {
  describe('happy path', () => {
    it('VALID: {quest in_progress, no running process} => paused:true and modify persists status=paused + pausedAtStatus=in_progress', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-happy' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('paused');
    });

    it('VALID: {quest with in_progress work items} => resets those work items to pending on persisted quest', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-reset-wi' });
      const guildId = GuildIdStub();
      const wiId = QuestWorkItemIdStub({ value: 'aaaaaaaa-0000-0000-0000-000000000001' });
      const workItem = WorkItemStub({ id: wiId, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({ id: wiId, role: 'codeweaver', status: 'pending' }),
      ]);
    });

    it('VALID: {previousStatus=seek_scope} => pausedAtStatus=seek_scope on persisted quest', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-snapshot-seek' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'seek_scope' });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'seek_scope' }),
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.pausedAtStatus).toBe('seek_scope');
    });
  });

  describe('subprocess kill behavior', () => {
    it('VALID: {quest has registered process} => kill invoked once with matching processId', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-kill' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuestFound({ quest });
      const kill = jest.fn();
      const processControls = buildProcessControls({ questIdMatch: questId, kill });

      await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls,
      });

      expect(processControls.kill.mock.calls).toStrictEqual([[{ processId: 'proc-match' }]]);
    });

    it('VALID: {no registered process} => kill never invoked, pause still succeeds', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-no-proc' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });
      expect(processControls.kill.mock.calls).toStrictEqual([]);
    });
  });

  describe('missing quest', () => {
    it('EMPTY: {quest not found} => returns {paused:false} and no quest is persisted', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-missing' });
      const guildId = GuildIdStub();
      proxy.setupQuestNotFound();
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls,
      });

      expect(result).toStrictEqual({ paused: false });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });
});

import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questPauseBroker } from './quest-pause-broker';
import { questPauseBrokerProxy } from './quest-pause-broker.proxy';

const buildProcessControls = ({
  questIdMatch,
  kill,
  processIds,
}: {
  questIdMatch?: ReturnType<typeof QuestIdStub>;
  kill?: jest.Mock;
  processIds?: readonly string[];
} = {}): {
  findAllByQuestId: jest.Mock;
  kill: jest.Mock;
} => {
  const killMock = kill ?? jest.fn();
  const ids = processIds ?? ['proc-match'];
  const findAllByQuestId =
    questIdMatch === undefined
      ? jest.fn().mockReturnValue([])
      : jest
          .fn()
          .mockImplementation(({ questId }: { questId: ReturnType<typeof QuestIdStub> }) =>
            questId === questIdMatch
              ? ids.map((processId) => ({ processId, questId: questIdMatch, kill: killMock }))
              : [],
          );
  return { findAllByQuestId, kill: killMock };
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
        previousStatus: 'in_progress',
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
      const wiId = QuestWorkItemIdStub({ value: '03048909-e478-200e-95e2-05df152332fb' });
      const workItem = WorkItemStub({ id: wiId, role: 'codeweaver', status: 'in_progress' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: 'in_progress',
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({ id: wiId, role: 'codeweaver', status: 'pending' }),
      ]);
    });

    it('VALID: {previousStatus=blocked} => pausedAtStatus=blocked on persisted quest', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-snapshot-blocked' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'blocked' });
      proxy.setupQuestFound({ quest });
      const processControls = buildProcessControls();

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: 'blocked',
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.pausedAtStatus).toBe('blocked');
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
        previousStatus: 'in_progress',
        processControls,
      });

      expect(processControls.kill.mock.calls).toStrictEqual([[{ processId: 'proc-match' }]]);
    });

    it('VALID: {quest at merging with a registered child} => kill invoked once with that processId, and the same persist stamps paused/merging', async () => {
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-merging-kill' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'merging' });
      proxy.setupQuestFound({ quest });
      const kill = jest.fn();
      const processControls = buildProcessControls({ questIdMatch: questId, kill });

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: 'merging',
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });
      expect(processControls.kill.mock.calls).toStrictEqual([[{ processId: 'proc-match' }]]);

      const persisted = proxy.getLastPersistedQuest();

      expect({ status: persisted.status, pausedAtStatus: persisted.pausedAtStatus }).toStrictEqual({
        status: 'paused',
        pausedAtStatus: 'merging',
      });
    });

    it('VALID: {quest with a no-op Start registration AND a live agent child} => kills BOTH, not just the first', async () => {
      // Start Quest registers a quest-level entry whose kill is a no-op, and it is registered
      // FIRST, so it sits earliest in the registry. A pause that stops at the first match kills
      // that no-op and leaves the real agent child running against the worktree.
      const proxy = questPauseBrokerProxy();
      proxy.setupPassthrough();
      const questId = QuestIdStub({ value: 'pause-two-registrations' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'merging' });
      proxy.setupQuestFound({ quest });
      const kill = jest.fn();
      const processControls = buildProcessControls({
        questIdMatch: questId,
        kill,
        processIds: [
          'proc-start-noop',
          'proc-warpgate-child',
        ],
      });

      const result = await questPauseBroker({
        questId,
        guildId,
        previousStatus: 'merging',
        processControls,
      });

      expect(result).toStrictEqual({ paused: true });
      expect(processControls.kill.mock.calls).toStrictEqual([
        [{ processId: 'proc-start-noop' }],
        [{ processId: 'proc-warpgate-child' }],
      ]);
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
        previousStatus: 'in_progress',
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
        previousStatus: 'in_progress',
        processControls,
      });

      expect(result).toStrictEqual({ paused: false });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });
});

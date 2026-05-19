import {
  FilePathStub,
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
import { questRegisterMonitorSessionBroker } from './quest-register-monitor-session-broker';
import { questRegisterMonitorSessionBrokerProxy } from './quest-register-monitor-session-broker.proxy';

type IsoTimestamp = ReturnType<typeof IsoTimestampStub>;
type FilePath = ReturnType<typeof FilePathStub>;

const makeMonitorSessionStub = ({
  initiallyRegistered,
}: {
  initiallyRegistered: boolean;
}): {
  isRegistered: () => boolean;
  register: (params: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  }) => void;
  getRegistered: () => {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null;
} => {
  let registered: {
    projectDir: FilePath;
    sessionFilePath: FilePath;
    registeredAt: IsoTimestamp;
  } | null = initiallyRegistered
    ? {
        projectDir: FilePathStub({ value: '/home/user/.claude/projects/-old-project' }),
        sessionFilePath: FilePathStub({
          value: '/home/user/.claude/projects/-old-project/old.jsonl',
        }),
        registeredAt: IsoTimestampStub({ value: '2026-01-01T00:00:00.000Z' }),
      }
    : null;

  return {
    isRegistered: (): boolean => registered !== null,
    register: ({
      projectDir,
      sessionFilePath,
      registeredAt,
    }: {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    }): void => {
      registered = { projectDir, sessionFilePath, registeredAt };
    },
    getRegistered: (): {
      projectDir: FilePath;
      sessionFilePath: FilePath;
      registeredAt: IsoTimestamp;
    } | null => registered,
  };
};

describe('questRegisterMonitorSessionBroker', () => {
  describe('first-time registration', () => {
    it('VALID: {monitorSession empty, no guilds} => registers and returns orphansReset: 0', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      proxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/abc-123.jsonl',
      });
      const projectDir = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj',
      });
      proxy.setupProjectDir({ result: projectDir });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: false });

      const result = await questRegisterMonitorSessionBroker({
        sessionFilePath,
        monitorSession,
      });

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 0,
      });
      expect(monitorSession.isRegistered()).toBe(true);

      const registered = monitorSession.getRegistered();

      expect(registered?.projectDir).toBe(projectDir);
      expect(registered?.sessionFilePath).toBe(sessionFilePath);
    });

    it('VALID: {approved quest with no orphans} => no resets, orphansReset: 0', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'quest-clean' }),
        status: 'approved',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      proxy.setupProjectDir({
        result: FilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' }),
      });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: false });

      const result = await questRegisterMonitorSessionBroker({
        sessionFilePath,
        monitorSession,
      });

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 0,
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('orphan reset', () => {
    it('VALID: {in_progress quest with two in_progress work items} => resets both and returns orphansReset: 2', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const orphanedItemAId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01';
      const orphanedItemBId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02';
      const quest = QuestStub({
        id: QuestIdStub({ value: 'quest-orphans' }),
        folder: '001-orphans-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: orphanedItemAId as never, status: 'in_progress' }),
          WorkItemStub({ id: orphanedItemBId as never, status: 'in_progress' }),
          WorkItemStub({
            id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee03' as never,
            status: 'complete',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      proxy.setupQuestModifyForOrphanReset({ quest });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      proxy.setupProjectDir({
        result: FilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' }),
      });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: false });

      const result = await questRegisterMonitorSessionBroker({
        sessionFilePath,
        monitorSession,
      });

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 2,
      });

      const persisted = proxy.getAllPersistedContents();
      const persistedQuests = persisted.map(
        (content) => JSON.parse(content as never) as Record<PropertyKey, unknown>,
      );
      const resetQuest = persistedQuests.find((q) => q.id === 'quest-orphans');
      const workItems = resetQuest!.workItems as Record<PropertyKey, unknown>[];
      const itemA = workItems.find((wi) => wi.id === orphanedItemAId);
      const itemB = workItems.find((wi) => wi.id === orphanedItemBId);

      expect(itemA?.status).toBe('pending');
      expect(itemB?.status).toBe('pending');
    });

    it('VALID: {complete quest with stale in_progress work item} => skipped, orphansReset: 0', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-1111-2222-3333-444444444444' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'quest-complete' }),
        status: 'complete',
        workItems: [WorkItemStub({ status: 'in_progress' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/sess.jsonl',
      });
      proxy.setupProjectDir({
        result: FilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' }),
      });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: false });

      const result = await questRegisterMonitorSessionBroker({
        sessionFilePath,
        monitorSession,
      });

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 0,
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('single-launcher semantics', () => {
    it('ERROR: {monitorSession already registered} => throws clear error and does not re-register', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      proxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
      proxy.setupProjectDir({
        result: FilePathStub({ value: '/home/user/.claude/projects/-home-user-proj' }),
      });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-home-user-proj/new.jsonl',
      });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: true });
      const before = monitorSession.getRegistered();

      await expect(
        questRegisterMonitorSessionBroker({ sessionFilePath, monitorSession }),
      ).rejects.toThrow(/already registered/u);

      expect(monitorSession.getRegistered()).toStrictEqual(before);
    });
  });

  describe('projectDir derivation', () => {
    it('VALID: {sessionFilePath: /home/user/.claude/projects/-foo/bar.jsonl} => projectDir is /home/user/.claude/projects/-foo', async () => {
      const proxy = questRegisterMonitorSessionBrokerProxy();
      proxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });
      const sessionFilePath = FilePathStub({
        value: '/home/user/.claude/projects/-foo/bar.jsonl',
      });
      const expectedProjectDir = FilePathStub({
        value: '/home/user/.claude/projects/-foo',
      });
      proxy.setupProjectDir({ result: expectedProjectDir });
      const monitorSession = makeMonitorSessionStub({ initiallyRegistered: false });

      await questRegisterMonitorSessionBroker({ sessionFilePath, monitorSession });

      expect(monitorSession.getRegistered()?.projectDir).toBe(expectedProjectDir);
    });
  });
});

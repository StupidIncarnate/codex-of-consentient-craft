import {
  GuildStub,
  GuildIdStub,
  QuestListItemStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { SessionSummaryStub } from '../../../contracts/session-summary/session-summary.stub';

import { sessionListBroker } from './session-list-broker';
import { sessionListBrokerProxy } from './session-list-broker.proxy';

type SessionSummary = ReturnType<typeof SessionSummaryStub>;

describe('sessionListBroker', () => {
  describe('session listing', () => {
    it('VALID: {guild with one session file} => returns session entry with summary', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Built login page"}' });
      proxy.setupQuests({ quests: [] });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'session-1',
          startedAt: undefined,
          summary: 'Built login page',
        },
      ]);
    });

    it('EMPTY: {no jsonl files} => returns empty array', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({ files: [] });
      proxy.setupQuests({ quests: [] });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {cached summary} => uses cache instead of reading file', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');
      const cachedSummary = SessionSummaryStub({ value: 'Cached summary' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupQuests({ quests: [] });

      const getCacheMock = jest.fn().mockReturnValue({ hit: true, summary: cachedSummary });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: true;
          summary: SessionSummary;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'session-1',
          startedAt: undefined,
          summary: 'Cached summary',
        },
      ]);
      expect(setCacheMock.mock.calls).toStrictEqual([]);
    });

    it('ERROR: {file read throws} => caches undefined summary and filters out session', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContentError({ error: new Error('read failed') });
      proxy.setupQuests({ quests: [] });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock: jest.Mock<
        void,
        [{ sessionId: unknown; mtimeMs: unknown; summary: unknown }]
      > = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([]);

      const setCacheCallCount = setCacheMock.mock.calls.length;

      expect(setCacheCallCount).toBe(1);

      const setCacheFirstCallArg = setCacheMock.mock.calls[0]?.[0];

      expect(setCacheFirstCallArg?.summary).toBe(undefined);
    });

    it('ERROR: {stat throws} => session entry is null and filtered out', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStatError({ error: new Error('stat failed') });
      proxy.setupQuests({ quests: [] });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('quest correlation', () => {
    it('VALID: {quest with matching activeSessionId} => attaches questId, questTitle, questStatus', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Built login page"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            activeSessionId: 'session-1',
            title: 'Add Authentication',
            status: 'in_progress',
          }),
        ],
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'session-1',
          startedAt: undefined,
          summary: 'Built login page',
          questId: 'add-auth',
          questTitle: 'Add Authentication',
          questStatus: 'in_progress',
        },
      ]);
    });

    it('VALID: {quest with userRequest} => preserves the session-specific summary, does not overwrite with userRequest', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Built login page"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            activeSessionId: 'session-1',
            userRequest: 'Implement OAuth login flow',
          }),
        ],
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'session-1',
          startedAt: undefined,
          summary: 'Built login page',
          questId: 'add-auth',
          questTitle: 'Add Authentication',
          questStatus: 'in_progress',
        },
      ]);
    });

    it('VALID: {quest with sessionId in different project dir} => finds session via cross-project glob and correlates', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/repo/.dungeonmaster-dev/guilds/__smoketests' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      // First glob (encoded guild path) finds nothing — smoketest sessions live elsewhere
      proxy.setupGlobFiles({ files: [] });
      // Second glob (cross-project lookup by sessionId) finds the JSONL under the repo-root encoded dir
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-repo/smoketest-session.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Smoketest run"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            activeSessionId: 'smoketest-session',
            title: 'Smoketest Quest',
            status: 'in_progress',
            userRequest: 'Smoketest user request',
          }),
        ],
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'smoketest-session',
          startedAt: undefined,
          summary: 'Smoketest run',
          questId: 'add-auth',
          questTitle: 'Smoketest Quest',
          questStatus: 'in_progress',
        },
      ]);
    });

    it('VALID: {quest with workItem sessionId matching disk file} => correlates via workItem sessionId', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');
      const workItemSessionId = SessionIdStub({ value: 'work-item-session' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/work-item-session.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Sub-agent work"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            // No activeSessionId - this is a completed quest, but its work item still has the session
            title: 'Completed Quest',
            status: 'complete',
          }),
        ],
      });
      proxy.setupLoadQuest({
        quest: QuestStub({
          workItems: [WorkItemStub({ sessionId: workItemSessionId })],
        }),
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'work-item-session',
          startedAt: undefined,
          summary: 'Sub-agent work',
          questId: 'add-auth',
          questTitle: 'Completed Quest',
          questStatus: 'complete',
        },
      ]);
    });

    it('EDGE: {one quest with two workItems sharing the same sessionId} => dedupes to one session entry', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');
      const sharedSessionId = SessionIdStub({ value: 'shared-session' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/shared-session.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Shared session work"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            title: 'Quest With Duplicate Work-Item Sessions',
            status: 'complete',
          }),
        ],
      });
      proxy.setupLoadQuest({
        quest: QuestStub({
          workItems: [
            WorkItemStub({
              id: '11111111-1111-4111-8111-111111111111',
              sessionId: sharedSessionId,
            }),
            WorkItemStub({
              id: '22222222-2222-4222-8222-222222222222',
              sessionId: sharedSessionId,
            }),
          ],
        }),
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'shared-session',
          startedAt: undefined,
          summary: 'Shared session work',
          questId: 'add-auth',
          questTitle: 'Quest With Duplicate Work-Item Sessions',
          questStatus: 'complete',
        },
      ]);
    });

    it('EDGE: {two quests with overlapping workItem sessionIds} => dedupes to one session entry', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');
      const overlappingSessionId = SessionIdStub({ value: 'overlapping-session' });

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/overlapping-session.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Cross-quest session"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            title: 'First Quest Sharing Session',
            status: 'complete',
          }),
          QuestListItemStub({
            title: 'Second Quest Sharing Session',
            status: 'complete',
          }),
        ],
      });
      proxy.setupLoadQuest({
        quest: QuestStub({
          workItems: [WorkItemStub({ sessionId: overlappingSessionId })],
        }),
      });
      proxy.setupLoadQuest({
        quest: QuestStub({
          workItems: [WorkItemStub({ sessionId: overlappingSessionId })],
        }),
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'overlapping-session',
          startedAt: undefined,
          summary: 'Cross-quest session',
          questId: 'add-auth',
          questTitle: 'Second Quest Sharing Session',
          questStatus: 'complete',
        },
      ]);
    });

    it('VALID: {quest without matching session} => session has no quest fields', async () => {
      const proxy = sessionListBrokerProxy();
      const guildId = GuildIdStub();
      const guild = GuildStub({ path: '/home/user/my-guild' });
      const birthtime = new Date('2025-01-15T10:00:00.000Z');

      proxy.setupGuild({ guild });
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupGlobFiles({
        files: ['/home/user/.claude/projects/-home-user-my-guild/session-1.jsonl'],
      });
      proxy.setupFileStat({ birthtime, mtimeMs: 1708473600000 });
      proxy.setupFileContent({ content: '{"type":"summary","summary":"Built login page"}' });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            activeSessionId: 'different-session',
          }),
        ],
      });

      const getCacheMock = jest.fn().mockReturnValue({ hit: false });
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([
        {
          sessionId: 'session-1',
          startedAt: undefined,
          summary: 'Built login page',
        },
      ]);
    });
  });
});

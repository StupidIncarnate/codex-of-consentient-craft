import { GuildStub, GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

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

      expect(result).toHaveLength(1);
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

      expect(result).toHaveLength(1);
      expect(setCacheMock).not.toHaveBeenCalled();
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
      const setCacheMock = jest.fn();

      const result = await sessionListBroker({
        guildId,
        getCache: getCacheMock as (params: { sessionId: unknown; mtimeMs: unknown }) => {
          hit: false;
        },
        setCache: setCacheMock,
      });

      expect(result).toStrictEqual([]);
      expect(setCacheMock).toHaveBeenCalledTimes(1);

      const setCacheFirstCallArg: unknown = setCacheMock.mock.calls[0]?.[0];

      expect(Reflect.get(setCacheFirstCallArg as object, 'summary')).toBeUndefined();
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

      expect(result).toHaveLength(1);

      const session: unknown = result[0];

      expect(Reflect.get(session as object, 'questId')).toBe('add-auth');
      expect(Reflect.get(session as object, 'questTitle')).toBe('Add Authentication');
      expect(Reflect.get(session as object, 'questStatus')).toBe('in_progress');
    });

    it('VALID: {quest with userRequest} => overrides session summary with userRequest', async () => {
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

      expect(result).toHaveLength(1);

      const session: unknown = result[0];

      expect(Reflect.get(session as object, 'summary')).toBe('Implement OAuth login flow');
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

      expect(result).toHaveLength(1);

      const session: unknown = result[0];

      expect(Reflect.get(session as object, 'questId')).toBeUndefined();
      expect(Reflect.get(session as object, 'questTitle')).toBeUndefined();
      expect(Reflect.get(session as object, 'questStatus')).toBeUndefined();
    });
  });
});

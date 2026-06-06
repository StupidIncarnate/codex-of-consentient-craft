import {
  AddQuestInputStub,
  GuildIdStub,
  GuildListItemStub,
  GuildStub,
  QuestIdStub,
  QuestTypeStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from './quest-mcp-create-broker';
import { questMcpCreateBrokerProxy } from './quest-mcp-create-broker.proxy';

const { userRequest } = AddQuestInputStub();

describe('questMcpCreateBroker', () => {
  describe('covering guild reused', () => {
    it('VALID: {covering guild exists} => resolves to { questId, guildSlug } and does not throw', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'My Guild' as never,
        path: '/home/dev/my-guild' as never,
        urlSlug: 'my-guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/my-guild', repoRoot: '/home/dev/my-guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'my-guild',
      });
    });

    it('VALID: {cwd is a subfolder, repo root resolves above it} => matches guild against resolved repo root, not the cwd', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      // Guild covers ONLY the resolved repo root; it does NOT cover the literal cwd.
      // If the broker matched against the cwd, no guild would cover it and guildAddBroker
      // would fire. Asserting guildAddBroker stays uncalled proves the repo-root match.
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Repo Guild' as never,
        path: '/home/dev/repo' as never,
        urlSlug: 'repo-guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/elsewhere', repoRoot: '/home/dev/repo' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'repo-guild',
      });
      expect(proxy.getGuildAddCalls()).toStrictEqual([]);
    });

    it('VALID: {one covering guild among many} => selects that guild and returns its urlSlug', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const firstGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'cccccccc-3333-4444-9555-666666666666' }),
        name: 'First Guild' as never,
        path: '/home/dev/first-guild' as never,
        urlSlug: 'first-guild' as never,
        valid: true,
      });
      const targetGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'dddddddd-4444-4555-9666-777777777777' }),
        name: 'Target Guild' as never,
        path: '/home/dev/target-guild' as never,
        urlSlug: 'target-guild' as never,
        valid: true,
      });
      const lastGuild = GuildListItemStub({
        id: GuildIdStub({ value: 'eeeeeeee-5555-4666-9777-888888888888' }),
        name: 'Last Guild' as never,
        path: '/home/dev/last-guild' as never,
        urlSlug: 'last-guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({
        cwd: '/home/dev/target-guild',
        repoRoot: '/home/dev/target-guild',
      });
      proxy.setupGuilds({ guilds: [firstGuild, targetGuild, lastGuild] });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result).toStrictEqual({
        questId,
        guildSlug: 'target-guild',
      });
    });

    it('VALID: {covering guild exists} => guildAddBroker is not called and returned guildSlug equals existing guild urlSlug', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Existing Guild' as never,
        path: '/home/dev/existing' as never,
        urlSlug: 'existing-guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/existing', repoRoot: '/home/dev/existing' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({});

      const result = await questMcpCreateBroker({ userRequest });

      expect(proxy.getGuildAddCalls()).toStrictEqual([]);
      expect(result.guildSlug).toBe('existing-guild');
    });

    it('VALID: {covering guild has no urlSlug} => derives the slug from the guild name', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'ffffffff-6666-4777-9888-999999999999' }),
        name: 'Another Guild' as never,
        path: '/home/dev/another-guild' as never,
        urlSlug: undefined,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({
        cwd: '/home/dev/another-guild',
        repoRoot: '/home/dev/another-guild',
      });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({});

      const result = await questMcpCreateBroker({ userRequest });

      expect(result.guildSlug).toBe('another-guild');
    });

    it('VALID: {questUserAddBroker succeeds} => returned questId equals the minted quest id', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: '99999999-9999-4999-9999-999999999999' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(result.questId).toBe('99999999-9999-4999-9999-999999999999');
    });
  });

  describe('auto-create guild', () => {
    it('VALID: {no covering guild} => guildAddBroker called once with derived name + repo-root path and the new urlSlug is returned', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const createdGuild = GuildStub({
        id: GuildIdStub({ value: 'cccccccc-cccc-4ccc-9ccc-cccccccccccc' }),
        name: 'Codex of Consentient Craft' as never,
        path: '/home/dev/codex-of-consentient-craft' as never,
        urlSlug: 'codex-of-consentient-craft' as never,
      });
      proxy.setupResolvedRepoRoot({
        cwd: '/home/dev/codex-of-consentient-craft',
        repoRoot: '/home/dev/codex-of-consentient-craft',
      });
      proxy.setupGuilds({ guilds: [] });
      proxy.setupAutoCreatedGuild({ guild: createdGuild });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(proxy.getGuildAddCalls()).toStrictEqual([
        {
          name: 'Codex of Consentient Craft',
          path: '/home/dev/codex-of-consentient-craft',
        },
      ]);
      expect(result).toStrictEqual({
        questId,
        guildSlug: 'codex-of-consentient-craft',
      });
    });
  });

  describe('repo-root resolution fallback', () => {
    it('EDGE: {cwdResolveBroker rejects, covering guild exists} => uses literal cwd, reuses covering guild, resolves without rethrowing', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Fresh Repo' as never,
        path: '/home/dev/fresh-repo' as never,
        urlSlug: 'fresh-repo' as never,
        valid: true,
      });
      proxy.setupResolveFallback({ cwd: '/home/dev/fresh-repo' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(proxy.getGuildAddCalls()).toStrictEqual([]);
      expect(result).toStrictEqual({
        questId,
        guildSlug: 'fresh-repo',
      });
    });

    it('EDGE: {cwdResolveBroker rejects, no covering guild} => guildAddBroker called once with literal cwd path + basename-derived name', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const createdGuild = GuildStub({
        id: GuildIdStub({ value: 'cccccccc-cccc-4ccc-9ccc-cccccccccccc' }),
        name: 'Codex of Consentient Craft' as never,
        path: '/home/dev/codex-of-consentient-craft' as never,
        urlSlug: 'codex-of-consentient-craft' as never,
      });
      proxy.setupResolveFallback({ cwd: '/home/dev/codex-of-consentient-craft' });
      proxy.setupGuilds({ guilds: [] });
      proxy.setupAutoCreatedGuild({ guild: createdGuild });
      proxy.setupSuccessfulAdd({ questId });

      const result = await questMcpCreateBroker({ userRequest });

      expect(proxy.getGuildAddCalls()).toStrictEqual([
        {
          name: 'Codex of Consentient Craft',
          path: '/home/dev/codex-of-consentient-craft',
        },
      ]);
      expect(result).toStrictEqual({
        questId,
        guildSlug: 'codex-of-consentient-craft',
      });
    });
  });

  describe('optional inputs forwarded to questUserAddBroker', () => {
    it('VALID: {questType provided} => forwards questType inside the quest input', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const questType = QuestTypeStub({ value: 'bug-hunt' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      await questMcpCreateBroker({ userRequest, questType });

      expect(proxy.getLastQuestAddCall().questType).toBe('bug-hunt');
    });

    it('VALID: {questType omitted} => quest input carries no questType', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      await questMcpCreateBroker({ userRequest });

      expect(proxy.getLastQuestAddCall().questType).toBe(undefined);
    });

    it('VALID: {sessionId provided} => forwards sessionId to questUserAddBroker', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const sessionId = SessionIdStub({ value: '77777777-7777-4777-9777-777777777777' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      await questMcpCreateBroker({ userRequest, sessionId });

      expect(proxy.getLastQuestAddCall().sessionId).toBe('77777777-7777-4777-9777-777777777777');
    });

    it('VALID: {sessionId omitted} => questUserAddBroker receives no sessionId', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSuccessfulAdd({ questId });

      await questMcpCreateBroker({ userRequest });

      expect(proxy.getLastQuestAddCall().sessionId).toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {cwdResolveBroker rejects with a non-ProjectRootNotFoundError} => rethrows that error', async () => {
      const proxy = questMcpCreateBrokerProxy();
      proxy.setupResolveError({
        cwd: '/home/dev/guild',
        error: new Error('disk read failed'),
      });

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(/disk read failed/u);
    });

    it('ERROR: {questUserAddBroker returns failure} => throws with the underlying error message', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: '22222222-2222-4222-9222-222222222222' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupAddFailure({ error: 'persist failed' });

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(/persist failed/u);
    });

    it('ERROR: {questUserAddBroker returns success but no questId} => throws with the unknown-error fallback message', async () => {
      const proxy = questMcpCreateBrokerProxy();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: '22222222-2222-4222-9222-222222222222' }),
        name: 'Guild' as never,
        path: '/home/dev/guild' as never,
        urlSlug: 'guild' as never,
        valid: true,
      });
      proxy.setupResolvedRepoRoot({ cwd: '/home/dev/guild', repoRoot: '/home/dev/guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupAddSuccessWithoutQuestId();

      await expect(questMcpCreateBroker({ userRequest })).rejects.toThrow(
        /Failed to create quest: unknown error/u,
      );
    });
  });
});

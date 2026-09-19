import { AbsoluteFilePathStub, ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { RecipeContextStub } from '../../../contracts/recipe-context/recipe-context.stub';
import { RecipeNameStub } from '../../../contracts/recipe-name/recipe-name.stub';
import { RecipeReturnNameStub } from '../../../contracts/recipe-return-name/recipe-return-name.stub';
import { recipeRunBroker } from './recipe-run-broker';
import { recipeRunBrokerProxy } from './recipe-run-broker.proxy';

const API = 'http://dungeonmaster.localhost:41001';
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const GUILD_PATH = '/tmp/dm-siege-inst_seed/siege-repo';
const TRANSCRIPT_DIR =
  '/tmp/dm-siege-inst_seed/.claude/projects/-tmp-dm-siege-inst-seed-siege-repo';
const SESSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const MINTED_QUEST_IDS = [
  'aaaaaaaa-1111-4111-8111-111111111111',
  'bbbbbbbb-2222-4222-8222-222222222222',
  'cccccccc-3333-4333-8333-333333333333',
];

describe('recipeRunBroker', () => {
  describe('routing', () => {
    it('VALID: {guild-with-three-quests} => runs the production recipe and returns its ids', async () => {
      const proxy = recipeRunBrokerProxy();
      proxy.guildLaneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });

      const result = await recipeRunBroker({
        name: RecipeNameStub({ value: 'guild-with-three-quests' }),
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        parameters: {},
      });

      expect(result).toStrictEqual({
        guildId: GUILD_ID,
        guildSlug: 'siege-guild',
        questId: 'bbbbbbbb-2222-4222-8222-222222222222',
      });
    });

    it('VALID: {session-with-nested-subagent, guild} => runs the direct recipe against that guild', async () => {
      const proxy = recipeRunBrokerProxy();
      proxy.sessionLaneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: [
          `${TRANSCRIPT_DIR}/${SESSION_ID}.jsonl`,
          `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000a1.jsonl`,
          `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000b2.jsonl`,
        ].map((value) => AbsoluteFilePathStub({ value })),
      });

      const result = await recipeRunBroker({
        name: RecipeNameStub({ value: 'session-with-nested-subagent' }),
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        parameters: { guild: ContentTextStub({ value: GUILD_ID }) },
      });

      expect(result).toStrictEqual({
        sessionId: SESSION_ID,
        'sessions.outer': `/siege-guild/session/${SESSION_ID}`,
        'sessions.nested': `/siege-guild/session/${SESSION_ID}`,
      });
      expect(proxy.filesWritten()).toStrictEqual([
        `${TRANSCRIPT_DIR}/${SESSION_ID}.jsonl`,
        `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000a1.jsonl`,
        `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000b2.jsonl`,
      ]);
    });
  });

  describe('composition', () => {
    it('VALID: {guild recipe then session recipe with its guildId} => the transcript lands under the guild the first one made', async () => {
      const proxy = recipeRunBrokerProxy();
      proxy.guildLaneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guild: GuildStub({
          id: GUILD_ID,
          name: 'Siege Guild',
          path: GUILD_PATH,
          urlSlug: 'siege-guild',
        }),
        questIds: MINTED_QUEST_IDS.map((value) => ContentTextStub({ value })),
      });
      proxy.sessionLaneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: [
          `${TRANSCRIPT_DIR}/${SESSION_ID}.jsonl`,
          `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000a1.jsonl`,
          `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000b2.jsonl`,
        ].map((value) => AbsoluteFilePathStub({ value })),
      });

      const guildResult = await recipeRunBroker({
        name: RecipeNameStub({ value: 'guild-with-three-quests' }),
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        parameters: {},
      });

      const sessionResult = await recipeRunBroker({
        name: RecipeNameStub({ value: 'session-with-nested-subagent' }),
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        parameters: {
          guild: ContentTextStub({
            value: String(guildResult[RecipeReturnNameStub({ value: 'guildId' })]),
          }),
        },
      });

      // The transcript directory is the ENCODING of the first recipe's own guild path, so a wrong
      // guildId would land the files somewhere else entirely.
      expect(proxy.filesWritten()).toStrictEqual([
        `${TRANSCRIPT_DIR}/${SESSION_ID}.jsonl`,
        `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000a1.jsonl`,
        `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-a1b2c3d4-0000-4000-8000-0000000000b2.jsonl`,
      ]);
      expect(sessionResult[RecipeReturnNameStub({ value: 'sessions.nested' })]).toBe(
        `/${String(guildResult[RecipeReturnNameStub({ value: 'guildSlug' })])}/session/${SESSION_ID}`,
      );
    });
  });

  describe('refusals', () => {
    it('ERROR: {a name no broker routes} => throws listing what is routed', async () => {
      recipeRunBrokerProxy();

      await expect(
        recipeRunBroker({
          name: RecipeNameStub({ value: 'quest-mid-execution' }),
          context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
          parameters: {},
        }),
      ).rejects.toThrow(
        /recipeRunBroker: "quest-mid-execution" is declared in the book but no broker routes it.*Routed: guild-with-three-quests, session-with-nested-subagent/su,
      );
    });
  });
});

import {
  AbsoluteFilePathStub,
  ContentTextStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { RecipeContextStub } from '../../../contracts/recipe-context/recipe-context.stub';
import { sessionWithNestedSubagentSeedBroker } from './session-with-nested-subagent-seed-broker';
import { sessionWithNestedSubagentSeedBrokerProxy } from './session-with-nested-subagent-seed-broker.proxy';

const API = 'http://dungeonmaster.localhost:41001';
const HOME = '/tmp/dm-siege-inst_seed';
const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const GUILD_PATH = '/tmp/dm-siege-inst_seed/siege-repo';
// `claudePathSlugEncoderTransformer` replaces every non-alphanumeric byte with a hyphen, one for
// one — this is that encoding of GUILD_PATH, and the directory the server's own reader computes.
const TRANSCRIPT_DIR =
  '/tmp/dm-siege-inst_seed/.claude/projects/-tmp-dm-siege-inst-seed-siege-repo';
const SESSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const OUTER_AGENT_ID = 'a1b2c3d4-0000-4000-8000-0000000000a1';
const NESTED_AGENT_ID = 'a1b2c3d4-0000-4000-8000-0000000000b2';
const MAIN_PATH = `${TRANSCRIPT_DIR}/${SESSION_ID}.jsonl`;
const OUTER_PATH = `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-${OUTER_AGENT_ID}.jsonl`;
const NESTED_PATH = `${TRANSCRIPT_DIR}/${SESSION_ID}/subagents/agent-${NESTED_AGENT_ID}.jsonl`;
const WRITTEN_PATHS = [MAIN_PATH, OUTER_PATH, NESTED_PATH];

describe('sessionWithNestedSubagentSeedBroker', () => {
  describe('where it writes', () => {
    it('VALID: {guild} => writes exactly the main transcript and the two sub-agent files', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: WRITTEN_PATHS.map((value) => AbsoluteFilePathStub({ value })),
      });

      await sessionWithNestedSubagentSeedBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        guild: GuildIdStub({ value: GUILD_ID }),
      });

      expect(proxy.filesWritten()).toStrictEqual([MAIN_PATH, OUTER_PATH, NESTED_PATH]);
    });
  });

  describe('what it returns', () => {
    it('VALID: {guild} => returns the session id and the route both chains render at', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: WRITTEN_PATHS.map((value) => AbsoluteFilePathStub({ value })),
      });

      const result = await sessionWithNestedSubagentSeedBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        guild: GuildIdStub({ value: GUILD_ID }),
      });

      expect(result).toStrictEqual({
        sessionId: SESSION_ID,
        'sessions.outer': `/siege-guild/session/${SESSION_ID}`,
        'sessions.nested': `/siege-guild/session/${SESSION_ID}`,
      });
    });
  });

  describe('the nesting the replay reader keys on', () => {
    it('VALID: {guild} => the MAIN file is the user line, the outer launch, the outer completion', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: WRITTEN_PATHS.map((value) => AbsoluteFilePathStub({ value })),
      });

      await sessionWithNestedSubagentSeedBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        guild: GuildIdStub({ value: GUILD_ID }),
      });

      const filePath = AbsoluteFilePathStub({ value: MAIN_PATH });

      expect(proxy.uuidsIn({ filePath })).toStrictEqual([
        `${SESSION_ID}-user`,
        `${SESSION_ID}-task-outer`,
        `${SESSION_ID}-task-outer-result`,
      ]);
      expect(proxy.timestampsIn({ filePath })).toStrictEqual([
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:01.000Z',
        '2026-01-01T00:00:10.000Z',
      ]);
      // The OUTER agent's completion is the one in the main file, and nothing else there is one.
      expect(proxy.completionAgentIdsIn({ filePath })).toStrictEqual([null, null, OUTER_AGENT_ID]);
    });

    it('VALID: {guild} => the OUTER agent file is its own text, the nested launch, the NESTED completion', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: WRITTEN_PATHS.map((value) => AbsoluteFilePathStub({ value })),
      });

      await sessionWithNestedSubagentSeedBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        guild: GuildIdStub({ value: GUILD_ID }),
      });

      const filePath = AbsoluteFilePathStub({ value: OUTER_PATH });

      expect(proxy.uuidsIn({ filePath })).toStrictEqual([
        `${SESSION_ID}-outer-text`,
        `${SESSION_ID}-task-nested`,
        `${SESSION_ID}-task-nested-result`,
      ]);
      // The nested completion sits in the OUTER agent's file and names the NESTED agent. That
      // placement is the whole difference between a nested chain and a second top-level one.
      expect(proxy.completionAgentIdsIn({ filePath })).toStrictEqual([null, null, NESTED_AGENT_ID]);
      // The outer agent writes BEFORE it launches, so the nested chain is the last thing in its body.
      expect(proxy.assistantTextsIn({ filePath })).toStrictEqual([
        'OUTER CHAIN BODY — written before the nested chain was launched.',
        null,
        null,
      ]);
      expect(proxy.toolUseIdsIn({ filePath })).toStrictEqual([
        null,
        'toolu_siege_nested_chain',
        'toolu_siege_nested_chain',
      ]);
    });

    it('VALID: {guild} => the NESTED agent file is one line, its marker text', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: WRITTEN_PATHS.map((value) => AbsoluteFilePathStub({ value })),
      });

      await sessionWithNestedSubagentSeedBroker({
        context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
        guild: GuildIdStub({ value: GUILD_ID }),
      });

      const filePath = AbsoluteFilePathStub({ value: NESTED_PATH });

      expect(proxy.uuidsIn({ filePath })).toStrictEqual([`${SESSION_ID}-nested-text`]);
      expect(proxy.assistantTextsIn({ filePath })).toStrictEqual([
        'NESTED CHAIN BODY — this chain sits inside the outer one.',
      ]);
      expect(proxy.timestampsIn({ filePath })).toStrictEqual(['2026-01-01T00:00:04.000Z']);
    });
  });

  describe('refusals', () => {
    it('ERROR: {a guild the lane does not know} => throws naming it and listing what the lane knows', async () => {
      const proxy = sessionWithNestedSubagentSeedBrokerProxy();
      proxy.laneAnswers({
        apiBaseUrl: ContentTextStub({ value: API }),
        guilds: [GuildStub({ id: GUILD_ID, path: GUILD_PATH, urlSlug: 'siege-guild' })],
        transcriptPaths: [],
      });

      await expect(
        sessionWithNestedSubagentSeedBroker({
          context: RecipeContextStub({ apiBaseUrl: API, homePath: HOME }),
          guild: GuildIdStub({ value: '00000000-0000-4000-8000-000000000000' }),
        }),
      ).rejects.toThrow(
        `session-with-nested-subagent: no guild "00000000-0000-4000-8000-000000000000" — the transcript has no path to be filed under. /api/guilds knows: ${GUILD_ID}`,
      );
    });
  });
});

import { AbsoluteFilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import { claudePathSlugEncoderTransformer } from '@dungeonmaster/shared/transformers';
import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';

import { laneApiHarness } from '../../../../test/harnesses/lane-api/lane-api.harness';
import { transcriptHarness } from '../../../../test/harnesses/transcript/transcript.harness';
import { RecipeContextStub } from '../../../contracts/recipe-context/recipe-context.stub';
import { sessionWithNestedSubagentSeedBroker } from './session-with-nested-subagent-seed-broker';

const GUILD_ID = '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41';
const SESSION_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const OUTER_AGENT_ID = 'a1b2c3d4-0000-4000-8000-0000000000a1';
const NESTED_AGENT_ID = 'a1b2c3d4-0000-4000-8000-0000000000b2';

describe('sessionWithNestedSubagentSeedBroker against a real filesystem', () => {
  // A real HTTP server for the one route the recipe reads, and a real temp filesystem it writes
  // into. A `direct` recipe is pure `fs` and tests under `installTestbedCreateBroker` with its own
  // temp dir (siegelense-recipes.md line 578).
  const laneApi = laneApiHarness();
  const transcripts = transcriptHarness();

  it('VALID: {a real guild path} => the three files land under THAT guild and read back as a nested chain', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'siege-recipe-session' }),
    });
    const guildPath = `${testbed.guildPath}/siege-repo`;
    laneApi.serveGuild({ id: GUILD_ID, path: guildPath, urlSlug: 'siege-guild' });

    const result = await sessionWithNestedSubagentSeedBroker({
      context: RecipeContextStub({ apiBaseUrl: laneApi.baseUrl(), homePath: testbed.guildPath }),
      guild: GuildIdStub({ value: GUILD_ID }),
    });

    // The directory the SERVER's own reader computes for this guild — derived from a temp path
    // nothing hardcoded, so a recipe filing under the wrong guild lands nowhere near it.
    const transcriptDir = claudePathSlugEncoderTransformer({
      homeDir: AbsoluteFilePathStub({ value: testbed.guildPath }),
      projectPath: AbsoluteFilePathStub({ value: guildPath }),
    });
    const relativeDir = transcriptDir.slice(testbed.guildPath.length + 1);

    const dirEntries = testbed.listDir({ relativePath: RelativePathStub({ value: relativeDir }) });
    const subagentEntries = testbed.listDir({
      relativePath: RelativePathStub({ value: `${relativeDir}/${SESSION_ID}/subagents` }),
    });
    const mainCompletions = transcripts.completionAgentIdsIn({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}.jsonl`,
    });
    const outerCompletions = transcripts.completionAgentIdsIn({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}/subagents/agent-${OUTER_AGENT_ID}.jsonl`,
    });
    const outerTexts = transcripts.assistantTextsIn({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}/subagents/agent-${OUTER_AGENT_ID}.jsonl`,
    });
    const nestedUuids = transcripts.uuidsIn({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}/subagents/agent-${NESTED_AGENT_ID}.jsonl`,
    });
    const nestedTexts = transcripts.assistantTextsIn({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}/subagents/agent-${NESTED_AGENT_ID}.jsonl`,
    });

    testbed.cleanup();

    expect(dirEntries).toStrictEqual([SESSION_ID, `${SESSION_ID}.jsonl`]);
    expect(subagentEntries).toStrictEqual([
      `agent-${OUTER_AGENT_ID}.jsonl`,
      `agent-${NESTED_AGENT_ID}.jsonl`,
    ]);
    // The outer Task's completion is in the MAIN file and names the OUTER agent.
    expect(mainCompletions).toStrictEqual([null, null, OUTER_AGENT_ID]);
    // The nested Task's completion is in the OUTER AGENT's file and names the NESTED agent. That
    // placement is what makes this a chain nested inside a chain rather than two sibling chains.
    expect(outerCompletions).toStrictEqual([null, null, NESTED_AGENT_ID]);
    expect(outerTexts).toStrictEqual([
      'OUTER CHAIN BODY — written before the nested chain was launched.',
      null,
      null,
    ]);
    expect(nestedUuids).toStrictEqual([`${SESSION_ID}-nested-text`]);
    expect(nestedTexts).toStrictEqual([
      'NESTED CHAIN BODY — this chain sits inside the outer one.',
    ]);
    expect(result).toStrictEqual({
      sessionId: SESSION_ID,
      'sessions.outer': `/siege-guild/session/${SESSION_ID}`,
      'sessions.nested': `/siege-guild/session/${SESSION_ID}`,
    });
  });

  it('VALID: {run twice} => produces byte-identical files, because nothing in it reads a clock', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'siege-recipe-session-twice' }),
    });
    const guildPath = `${testbed.guildPath}/siege-repo`;
    laneApi.serveGuild({ id: GUILD_ID, path: guildPath, urlSlug: 'siege-guild' });

    await sessionWithNestedSubagentSeedBroker({
      context: RecipeContextStub({ apiBaseUrl: laneApi.baseUrl(), homePath: testbed.guildPath }),
      guild: GuildIdStub({ value: GUILD_ID }),
    });

    const transcriptDir = claudePathSlugEncoderTransformer({
      homeDir: AbsoluteFilePathStub({ value: testbed.guildPath }),
      projectPath: AbsoluteFilePathStub({ value: guildPath }),
    });
    const relativeDir = transcriptDir.slice(testbed.guildPath.length + 1);
    const firstContents = transcripts.contentsOf({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}.jsonl`,
    });

    await sessionWithNestedSubagentSeedBroker({
      context: RecipeContextStub({ apiBaseUrl: laneApi.baseUrl(), homePath: testbed.guildPath }),
      guild: GuildIdStub({ value: GUILD_ID }),
    });

    const secondContents = transcripts.contentsOf({
      testbed,
      relativePath: `${relativeDir}/${SESSION_ID}.jsonl`,
    });

    testbed.cleanup();

    expect(secondContents).toBe(firstContents);
  });
});

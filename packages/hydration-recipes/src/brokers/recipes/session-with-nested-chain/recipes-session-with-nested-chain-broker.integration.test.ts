import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { AgentIdStub } from '@dungeonmaster/shared/contracts/agent-id/agent-id.stub';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { subagentQueryRouteBroker } from '../../subagent/query-route/subagent-query-route-broker';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesSessionWithNestedChainBroker } from './recipes-session-with-nested-chain-broker';
import { toolUseIdFromParentLinesTransformer } from '../../../transformers/tool-use-id-from-parent-lines/tool-use-id-from-parent-lines-transformer';
import type { SessionRecordStub } from '../../../contracts/session-record/session-record.stub';
import type { SubagentRecordStub } from '../../../contracts/subagent-record/subagent-record.stub';
import { SessionWithNestedChainInputsStub } from '../../../contracts/session-with-nested-chain-inputs/session-with-nested-chain-inputs.stub';

type Guild = ReturnType<typeof GuildStub>;
type SessionRecord = ReturnType<typeof SessionRecordStub>;
type SubagentRecord = ReturnType<typeof SubagentRecordStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = 'guild';
const NESTED_NAME = 'nested';

describe('recipesSessionWithNestedChainBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and a real inputs schema', () => {
      expect({
        recipeName: recipesSessionWithNestedChainBroker.recipeName,
        description: recipesSessionWithNestedChainBroker.description,
        hasInputs: recipesSessionWithNestedChainBroker.inputs !== undefined,
      }).toStrictEqual({
        recipeName: 'session-with-nested-chain',
        description:
          'one session under an existing guild, holding a nested sub-agent chain two levels deep ' +
          '— a top agent with one sub-agent nested under it',
        hasInputs: true,
      });
    });
  });

  describe('stacked on a guild an EARLIER step made, against a real temporary directory', () => {
    const fileTarget = fileTargetHarness();

    it('VALID: {guildPath from an earlier step} => saves exactly nested', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(
        recipesSessionWithNestedChainBroker(SessionWithNestedChainInputsStub({ guildPath: guild.path })),
        target,
      );

      expect(Object.keys(result).sort()).toStrictEqual(['nested']);
    });

    it("VALID: {guildPath from an earlier step} => the session's directory is under THAT guild's own path", async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(
        recipesSessionWithNestedChainBroker(SessionWithNestedChainInputsStub({ guildPath: guild.path })),
        target,
      );
      const nested = (result as Record<PropertyKey, unknown>)[NESTED_NAME] as SessionRecord;

      expect({ sessionId: nested.sessionId, cwd: nested.cwd }).toStrictEqual({
        sessionId: 'seed-session-1',
        cwd: guild.path,
      });
    });

    it('VALID: {guildPath from an earlier step} => withNestedChain writes two correlated sub-agent transcripts', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(
        recipesSessionWithNestedChainBroker(SessionWithNestedChainInputsStub({ guildPath: guild.path })),
        target,
      );
      const nested = (result as Record<PropertyKey, unknown>)[NESTED_NAME] as SessionRecord;

      const subagents = subagentQueryRouteBroker({
        target,
        where: { cwd: nested.cwd, sessionId: nested.sessionId },
      });

      expect(subagents.map((subagent) => subagent.agentId).sort()).toStrictEqual([
        'seed-agent-1',
        'seed-agent-1-1',
      ]);
    });

    // DEF-91: the session's own transcript now carries a real user turn plus a three-line count
    // (user, Task tool_use, tool_result) instead of a bare init line, both sub-agents resolve
    // through `subagentQueryRouteBroker`'s widened search pool, and — the claim that distinguishes
    // this fix from the old flat-in-session-only shape — the NESTED level's own Task/tool_result
    // pairing is found by scanning ONLY the outer agent's own file, exactly as
    // `chatHistoryReplayBroker`'s own header describes ("B's completion tool_result lives in A's
    // subagent JSONL"). `toolUseIdFromParentLinesTransformer` is the same pairing primitive the web's
    // chat replay pipeline is built on (`toolUseResult.agentId` on a `tool_result` line resolved back
    // to the `id` on the matching assistant `tool_use`).
    it('VALID: {guildPath from an earlier step} => a real user turn, two resolvable sub-agents, and the nested pairing lives in the outer agent file', async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(
        recipesSessionWithNestedChainBroker(SessionWithNestedChainInputsStub({ guildPath: guild.path })),
        target,
      );
      const nested = (result as Record<PropertyKey, unknown>)[NESTED_NAME] as SessionRecord;

      const subagents = subagentQueryRouteBroker({
        target,
        where: { cwd: nested.cwd, sessionId: nested.sessionId },
      }) as unknown as SubagentRecord[];
      const outerAgent = subagents.find((subagent) => subagent.agentId === 'seed-agent-1')!;
      const nestedAgent = subagents.find((subagent) => subagent.agentId === 'seed-agent-1-1')!;

      const sessionRawLines = fileTarget.readAbsoluteFileLines({ filePath: nested.filePath });
      const outerAgentRawLines = fileTarget.readAbsoluteFileLines({
        filePath: outerAgent.filePath,
      });

      const outerPairedFromItsOwnFile = toolUseIdFromParentLinesTransformer({
        parentLines: outerAgentRawLines,
        agentId: AgentIdStub({ value: 'seed-agent-1-1' }),
      });

      expect({
        // `nested.lineCount` is frozen at CREATE time by `saveRecordAs` (1 — the recipe's own
        // initial user line) and never updated when `withNestedChain` appends afterward
        // (`packages/hydration-recipes/CLAUDE.md`'s "saveRecordAs freezes a row's record" section),
        // so the REAL total is read straight off disk instead.
        sessionLineCountOnDisk: sessionRawLines.length,
        sessionHasRealUserTurn: sessionRawLines.some((line) =>
          line.includes('Dispatch a nested sub-agent chain'),
        ),
        subagentsByAgentId: [
          {
            agentId: outerAgent.agentId,
            toolUseId: outerAgent.toolUseId,
            lineCount: outerAgent.lineCount,
          },
          {
            agentId: nestedAgent.agentId,
            toolUseId: nestedAgent.toolUseId,
            lineCount: nestedAgent.lineCount,
          },
        ],
        outerPairedFromItsOwnFile,
      }).toStrictEqual({
        sessionLineCountOnDisk: 3,
        sessionHasRealUserTurn: true,
        subagentsByAgentId: [
          { agentId: 'seed-agent-1', toolUseId: 'toolu_seed_nested_1', lineCount: 3 },
          { agentId: 'seed-agent-1-1', toolUseId: 'toolu_seed_nested_2', lineCount: 1 },
        ],
        outerPairedFromItsOwnFile: 'toolu_seed_nested_2',
      });
    });
  });
});

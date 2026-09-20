import type { GuildStub } from '@dungeonmaster/shared/contracts';
import { SavedRecordNameStub } from '@dungeonmaster/hydration/contracts';

import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';
import { subagentQueryRouteBroker } from '../../subagent/query-route/subagent-query-route-broker';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesGuildMidExecutionBroker } from '../guild-mid-execution/recipes-guild-mid-execution-broker';
import { recipesSessionWithNestedChainBroker } from './recipes-session-with-nested-chain-broker';
import type { SessionRecordStub } from '../../../contracts/session-record/session-record.stub';

type Guild = ReturnType<typeof GuildStub>;
type SessionRecord = ReturnType<typeof SessionRecordStub>;

const { run } = dmRegistryBroker;

const GUILD_NAME = SavedRecordNameStub({ value: 'guild' });
const NESTED_NAME = SavedRecordNameStub({ value: 'nested' });

describe('recipesSessionWithNestedChainBroker', () => {
  describe('the manifest identity chunk 8 reads off this same export', () => {
    it('VALID: {} => carries its verbatim name, description, and a real inputs schema', () => {
      expect({
        recipeName: recipesSessionWithNestedChainBroker.recipeName,
        description: recipesSessionWithNestedChainBroker.description,
        hasInputs: recipesSessionWithNestedChainBroker.inputs !== undefined,
      }).toStrictEqual({
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild, holding a nested sub-agent chain',
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
        recipesSessionWithNestedChainBroker({ guildPath: guild.path }),
        target,
      );

      expect(Object.keys(result).sort()).toStrictEqual(['nested']);
    });

    it("VALID: {guildPath from an earlier step} => the session's directory is under THAT guild's own path", async () => {
      const target = fileTarget.target();
      const earlierStep = await run(recipesGuildMidExecutionBroker(), target);
      const guild = earlierStep[GUILD_NAME] as unknown as Guild;

      const result = await run(
        recipesSessionWithNestedChainBroker({ guildPath: guild.path }),
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
        recipesSessionWithNestedChainBroker({ guildPath: guild.path }),
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
  });
});

/**
 * PURPOSE: The session ingredient's `withNestedChain` extra — writes `depth` sub-agent
 * transcripts, each nested under the previous one's own `agentId` (`seed-agent-1`, then
 * `seed-agent-1-1`, …), so a caller can prove a multi-level Task chain without a real dispatch.
 *
 * USAGE:
 * await sessionNestedChainBroker({ target, record: sessionRecord, args: { depth: 2 } });
 * // Writes agent-seed-agent-1.jsonl, then agent-seed-agent-1-1.jsonl nested under it
 */
import { agentIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { subagentWriteRouteBroker } from '../../subagent/write-route/subagent-write-route-broker';
import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { toolUseIdContract } from '../../../contracts/tool-use-id/tool-use-id-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const NESTING_SUFFIX = '-1';

export const sessionNestedChainBroker = async ({
  target,
  record,
  args,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
  args: Record<string, unknown>;
}): Promise<AdapterResult> => {
  const { depth } = nestedChainArgsContract.parse(args);
  const sessionId = sessionIdContract.parse(record.sessionId);
  const cwd = absoluteFilePathContract.parse(record.cwd);
  const levels = Array.from({ length: depth }, (_unused, index) => index + 1);

  await Promise.all(
    levels.map(async (level) => {
      const agentId = agentIdContract.parse(`seed-agent-1${NESTING_SUFFIX.repeat(level - 1)}`);

      return subagentWriteRouteBroker({
        target,
        fields: {
          agentId,
          toolUseId: toolUseIdContract.parse(`toolu_seed_nested_${level}`),
          taskDescription: `Nested task ${level}`,
          taskPrompt: `Nested prompt ${level}`,
          lines: ['{"type":"init"}'],
          completed: true,
          sessionId,
          cwd,
        },
      });
    }),
  );

  return { success: true };
};

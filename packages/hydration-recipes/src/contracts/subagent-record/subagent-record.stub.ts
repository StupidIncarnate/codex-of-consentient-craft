/**
 * PURPOSE: Builds a valid `SubagentRecord` for a test that needs one but does not care which agent
 * or file it names.
 *
 * USAGE:
 * SubagentRecordStub({ agentId: 'seed-agent-1' });
 * // Returns SubagentRecord
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { subagentRecordContract } from './subagent-record-contract';
import type { SubagentRecord } from './subagent-record-contract';

export const SubagentRecordStub = ({
  ...props
}: StubArgument<SubagentRecord> = {}): SubagentRecord =>
  subagentRecordContract.parse({
    agentId: 'seed-agent-1',
    toolUseId: 'toolu_seed1',
    filePath:
      '/tmp/subagent-record-stub/guild-1/.claude/projects/-tmp-guild-1/seed-session-1/subagents/agent-seed-agent-1.jsonl',
    lineCount: 1,
    ...props,
  });

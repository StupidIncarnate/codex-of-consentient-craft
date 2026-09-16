/**
 * PURPOSE: Builds a valid `SubagentFields` for a test that needs one but does not care which agent,
 * task or lines it carries.
 *
 * USAGE:
 * SubagentFieldsStub({ agentId: 'seed-agent-1' });
 * // Returns SubagentFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { StreamJsonLineStub } from '@dungeonmaster/shared/contracts';

import { subagentFieldsContract } from './subagent-fields-contract';
import type { SubagentFields } from './subagent-fields-contract';

export const SubagentFieldsStub = ({
  ...props
}: StubArgument<SubagentFields> = {}): SubagentFields =>
  subagentFieldsContract.parse({
    agentId: 'seed-agent-1',
    toolUseId: 'toolu_seed1',
    taskDescription: 'Seeded task 1',
    taskPrompt: 'Research the auth system and report back with file paths and purposes.',
    lines: [StreamJsonLineStub()],
    completed: true,
    sessionId: 'seed-session-1',
    cwd: '/tmp/subagent-fields-stub/guild-1',
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  claudeCodeSubagentMetaContract,
  type ClaudeCodeSubagentMeta,
} from './claude-code-subagent-meta-contract';

export const ClaudeCodeSubagentMetaStub = ({
  ...props
}: StubArgument<ClaudeCodeSubagentMeta> = {}): ClaudeCodeSubagentMeta =>
  claudeCodeSubagentMetaContract.parse({
    toolUseId: 'toolu_01B3VQHjYXB5Wap7jrw1T3uS',
    agentType: 'general-purpose',
    description: 'pathseeker-walk dispatch',
    ...props,
  });

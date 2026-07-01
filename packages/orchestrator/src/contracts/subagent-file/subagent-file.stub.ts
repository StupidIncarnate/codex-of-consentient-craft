import type { StubArgument } from '@dungeonmaster/shared/@types';

import { AgentIdStub } from '../agent-id/agent-id.stub';

import { subagentFileContract } from './subagent-file-contract';
import type { SubagentFile } from './subagent-file-contract';

export const SubagentFileStub = ({ ...props }: StubArgument<SubagentFile> = {}): SubagentFile =>
  subagentFileContract.parse({
    agentId: AgentIdStub(),
    lines: [],
    ...props,
  });

import { subagentWindowContract, type SubagentWindow } from './subagent-window-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SubagentWindowStub = ({
  ...props
}: StubArgument<SubagentWindow> = {}): SubagentWindow =>
  subagentWindowContract.parse({
    agentId: 'agent-abc',
    startedAt: '2026-09-01T19:09:06.542Z',
    endedAt: '2026-09-01T19:12:00.000Z',
    ...props,
  });

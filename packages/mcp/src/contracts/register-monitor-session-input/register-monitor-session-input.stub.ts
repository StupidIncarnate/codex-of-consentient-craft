import type { StubArgument } from '@dungeonmaster/shared/@types';

import { AbsolutePathStub } from '../absolute-path/absolute-path.stub';
import { registerMonitorSessionInputContract } from './register-monitor-session-input-contract';
import type { RegisterMonitorSessionInput } from './register-monitor-session-input-contract';

export const RegisterMonitorSessionInputStub = ({
  ...props
}: StubArgument<RegisterMonitorSessionInput> = {}): RegisterMonitorSessionInput =>
  registerMonitorSessionInputContract.parse({
    sessionFilePath: AbsolutePathStub({
      value: '/home/user/.claude/projects/-home-user-project/abc-123.jsonl',
    }),
    ...props,
  });

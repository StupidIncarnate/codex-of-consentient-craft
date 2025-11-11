import type { StubArgument } from '@questmaestro/shared/@types';
import { childProcessContract } from './child-process-contract';
import type { ChildProcess } from './child-process-contract';

export const ChildProcessStub = ({ ...props }: StubArgument<ChildProcess> = {}): ChildProcess =>
  childProcessContract.parse({
    pid: 1234,
    stdin: null,
    stdout: null,
    stderr: null,
    stdio: [null, null, null],
    ...props,
  });

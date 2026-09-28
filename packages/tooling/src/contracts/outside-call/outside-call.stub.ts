import { outsideCallContract } from './outside-call-contract';
import type { OutsideCall } from './outside-call-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const OutsideCallStub = ({ ...props }: StubArgument<OutsideCall> = {}): OutsideCall =>
  outsideCallContract.parse({
    module: 'fs/promises',
    name: 'readFile',
    ...props,
  });

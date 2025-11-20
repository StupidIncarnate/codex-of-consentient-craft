import type { StubArgument } from '@questmaestro/shared/@types';
import { mockProcessBehaviorContract } from './mock-process-behavior-contract';
import type { MockProcessBehavior } from './mock-process-behavior-contract';
import { MockSpawnResultStub } from '../mock-spawn-result/mock-spawn-result.stub';

export const MockProcessBehaviorStub = ({
  ...props
}: StubArgument<MockProcessBehavior> = {}): MockProcessBehavior =>
  mockProcessBehaviorContract.parse({
    result: MockSpawnResultStub(),
    ...props,
  });

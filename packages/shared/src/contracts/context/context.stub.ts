import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contextContract } from './context-contract';
import type { Context } from './context-contract';

export const ContextStub = ({ ...props }: StubArgument<Context> = {}): Context =>
  contextContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Test Context',
    description: 'A test context for unit tests',
    locator: {},
    ...props,
  });

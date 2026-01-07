import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contextLocatorContract } from './context-locator-contract';
import type { ContextLocator } from './context-locator-contract';

export const ContextLocatorStub = ({
  ...props
}: StubArgument<ContextLocator> = {}): ContextLocator =>
  contextLocatorContract.parse({
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { isolateModulesMockContract } from './isolate-modules-mock-contract';
import type { IsolateModulesMock } from './isolate-modules-mock-contract';

export const IsolateModulesMockStub = ({
  ...props
}: StubArgument<IsolateModulesMock> = {}): IsolateModulesMock => {
  const { factory, ...dataProps } = props;

  return {
    ...isolateModulesMockContract.parse({
      module: '/abs/module',
      ...dataProps,
    }),
    factory: factory ?? ((): Record<PropertyKey, unknown> => ({})),
  };
};

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { tsconfigJsonContract, type TsconfigJson } from './tsconfig-json-contract';

export const TsconfigJsonStub = ({ ...props }: StubArgument<TsconfigJson> = {}): TsconfigJson =>
  tsconfigJsonContract.parse({
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
    ...props,
  });

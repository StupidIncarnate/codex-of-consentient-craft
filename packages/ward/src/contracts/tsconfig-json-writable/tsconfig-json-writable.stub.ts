import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  tsconfigJsonWritableContract,
  type TsconfigJsonWritable,
} from './tsconfig-json-writable-contract';

export const TsconfigJsonWritableStub = ({
  ...props
}: StubArgument<TsconfigJsonWritable> = {}): TsconfigJsonWritable => {
  const base: Record<string, unknown> = {
    compilerOptions: { composite: true },
    references: [],
  };
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      base[key] = value;
    }
  }
  return tsconfigJsonWritableContract.parse(base);
};

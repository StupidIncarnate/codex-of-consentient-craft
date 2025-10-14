import { tsconfigOptionsContract } from './tsconfig-options-contract';
import type { TsconfigOptions } from './tsconfig-options-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const TsconfigOptionsStub = ({
  ...props
}: StubArgument<TsconfigOptions> = {}): TsconfigOptions =>
  tsconfigOptionsContract.parse({
    target: 'ES2020',
    module: 'commonjs',
    lib: ['ES2020'],
    strict: true,
    noEmit: false,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    moduleResolution: 'node',
    ...props,
  });

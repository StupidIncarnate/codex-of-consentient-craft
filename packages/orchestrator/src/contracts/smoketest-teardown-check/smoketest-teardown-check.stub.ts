import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestTeardownCheckContract } from './smoketest-teardown-check-contract';
import type { SmoketestTeardownCheck } from './smoketest-teardown-check-contract';

export const PortFreeTeardownCheckStub = ({
  ...props
}: StubArgument<
  Extract<SmoketestTeardownCheck, { kind: 'port-free' }>
> = {}): SmoketestTeardownCheck =>
  smoketestTeardownCheckContract.parse({
    kind: 'port-free',
    port: 4751,
    ...props,
  });

export const ProcessGoneTeardownCheckStub = ({
  ...props
}: StubArgument<
  Extract<SmoketestTeardownCheck, { kind: 'process-gone' }>
> = {}): SmoketestTeardownCheck =>
  smoketestTeardownCheckContract.parse({
    kind: 'process-gone',
    pid: 12345,
    ...props,
  });

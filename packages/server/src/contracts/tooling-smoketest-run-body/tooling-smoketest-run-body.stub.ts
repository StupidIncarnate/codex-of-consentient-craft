import type { StubArgument } from '@dungeonmaster/shared/@types';
import { toolingSmoketestRunBodyContract } from './tooling-smoketest-run-body-contract';
import type { ToolingSmoketestRunBody } from './tooling-smoketest-run-body-contract';

export const ToolingSmoketestRunBodyStub = ({
  ...props
}: StubArgument<ToolingSmoketestRunBody> = {}): ToolingSmoketestRunBody =>
  toolingSmoketestRunBodyContract.parse({
    suite: 'mcp',
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { playwrightSuiteContract, type PlaywrightSuite } from './playwright-suite-contract';

export const PlaywrightSuiteStub = ({
  ...props
}: StubArgument<PlaywrightSuite> = {}): PlaywrightSuite =>
  playwrightSuiteContract.parse({
    title: 'login',
    ...props,
  });

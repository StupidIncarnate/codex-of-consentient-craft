import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  playwrightTestResultContract,
  type PlaywrightTestResult,
} from './playwright-test-result-contract';

export const PlaywrightTestResultStub = ({
  ...props
}: StubArgument<PlaywrightTestResult> = {}): PlaywrightTestResult =>
  playwrightTestResultContract.parse({
    status: 'failed',
    ...props,
  });

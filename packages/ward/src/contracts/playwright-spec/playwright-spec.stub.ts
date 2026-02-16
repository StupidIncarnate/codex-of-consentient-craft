import type { StubArgument } from '@dungeonmaster/shared/@types';
import { playwrightSpecContract, type PlaywrightSpec } from './playwright-spec-contract';
import { PlaywrightTestResultStub } from '../playwright-test-result/playwright-test-result.stub';

export const PlaywrightSpecStub = ({
  ...props
}: StubArgument<PlaywrightSpec> = {}): PlaywrightSpec =>
  playwrightSpecContract.parse({
    title: 'should login',
    tests: [{ results: [PlaywrightTestResultStub()] }],
    ...props,
  });

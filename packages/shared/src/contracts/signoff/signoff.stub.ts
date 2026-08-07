import type { StubArgument } from '@dungeonmaster/shared/@types';

import { signoffContract } from './signoff-contract';
import type { Signoff } from './signoff-contract';

export const SignoffStub = ({ ...props }: StubArgument<Signoff> = {}): Signoff =>
  signoffContract.parse({
    verdict: 'confirmed',
    evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

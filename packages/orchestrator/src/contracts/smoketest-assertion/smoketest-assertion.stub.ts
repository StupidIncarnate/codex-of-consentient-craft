import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestAssertionContract } from './smoketest-assertion-contract';
import type { SmoketestAssertion } from './smoketest-assertion-contract';

export const QuestStatusAssertionStub = ({
  ...props
}: StubArgument<Extract<SmoketestAssertion, { kind: 'quest-status' }>> = {}): SmoketestAssertion =>
  smoketestAssertionContract.parse({
    kind: 'quest-status',
    expected: 'complete',
    ...props,
  });

export const WorkItemStatusHistogramAssertionStub = ({
  ...props
}: StubArgument<
  Extract<SmoketestAssertion, { kind: 'work-item-status-histogram' }>
> = {}): SmoketestAssertion =>
  smoketestAssertionContract.parse({
    kind: 'work-item-status-histogram',
    expected: { complete: 3, skipped: 1 },
    ...props,
  });

export const WorkItemRoleCountAssertionStub = ({
  ...props
}: StubArgument<
  Extract<SmoketestAssertion, { kind: 'work-item-role-count' }>
> = {}): SmoketestAssertion =>
  smoketestAssertionContract.parse({
    kind: 'work-item-role-count',
    role: 'pathseeker',
    minCount: 2,
    ...props,
  });

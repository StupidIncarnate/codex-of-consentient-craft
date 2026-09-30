/**
 * PURPOSE: Builds a valid InstanceStateResolveResult for tests
 *
 * USAGE:
 * InstanceStateResolveResultStub();
 * // Returns a valid InstanceStateResolveResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstanceStateStub } from '../instance-state/instance-state.stub';
import { RegistryEntryStub } from '../registry-entry/registry-entry.stub';

import { instanceStateResolveResultContract } from './instance-state-resolve-result-contract';
import type { InstanceStateResolveResult } from './instance-state-resolve-result-contract';

export const InstanceStateResolveResultStub = ({
  ...props
}: StubArgument<InstanceStateResolveResult> = {}): InstanceStateResolveResult =>
  instanceStateResolveResultContract.parse({
    state: InstanceStateStub(),
    entry: RegistryEntryStub(),
    ...props,
  });

/**
 * PURPOSE: Builds a valid SmoketestScenarioMetaState for tests
 *
 * USAGE:
 * SmoketestScenarioMetaStateStub();
 * // Returns a valid SmoketestScenarioMetaState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestScenarioMetaStateContract } from './smoketest-scenario-meta-state-contract';
import type { SmoketestScenarioMetaState } from './smoketest-scenario-meta-state-contract';

export const SmoketestScenarioMetaStateStub = ({
  ...props
}: StubArgument<SmoketestScenarioMetaState> = {}): SmoketestScenarioMetaState =>
  smoketestScenarioMetaStateContract.parse({ entries: new Map(), ...props });

/**
 * PURPOSE: Builds a valid SmoketestScenarioState for tests
 *
 * USAGE:
 * SmoketestScenarioStateStub();
 * // Returns a valid SmoketestScenarioState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestScenarioStateContract } from './smoketest-scenario-state-contract';
import type { SmoketestScenarioState } from './smoketest-scenario-state-contract';

export const SmoketestScenarioStateStub = ({
  ...props
}: StubArgument<SmoketestScenarioState> = {}): SmoketestScenarioState =>
  smoketestScenarioStateContract.parse({ instances: new Map(), ...props });

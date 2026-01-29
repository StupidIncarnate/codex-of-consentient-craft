/**
 * PURPOSE: Creates test data for E2EScreenState contract
 *
 * USAGE:
 * const state = E2EScreenStateStub(); // Returns default menu state
 * const custom = E2EScreenStateStub({ name: 'list', frame: 'quest list here' });
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { e2eScreenStateContract } from './e2e-screen-state-contract';
import type { E2EScreenState } from './e2e-screen-state-contract';

export const E2EScreenStateStub = ({
  ...props
}: StubArgument<E2EScreenState> = {}): E2EScreenState =>
  e2eScreenStateContract.parse({
    name: 'menu',
    frame: '┌──────────┐\n│  Menu    │\n└──────────┘',
    capturedAt: 1704067200000,
    ...props,
  });

/**
 * PURPOSE: Creates test data for E2ETestbed contract
 *
 * USAGE:
 * const data = E2ETestbedStub(); // Returns default testbed data
 * const custom = E2ETestbedStub({ projectPath: '/custom/path' });
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { e2eTestbedContract } from './e2e-testbed-contract';
import type { E2ETestbedData } from './e2e-testbed-contract';

export const E2ETestbedStub = ({ ...props }: StubArgument<E2ETestbedData> = {}): E2ETestbedData =>
  e2eTestbedContract.parse({
    projectPath: '/tmp/e2e-test-default',
    dungeonmasterPath: '/home/user/dungeonmaster',
    ...props,
  });

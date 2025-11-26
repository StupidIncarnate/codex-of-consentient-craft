/**
 * PURPOSE: Lists all created integration test environments for inspection
 *
 * USAGE:
 * const environments = integrationEnvironmentListBroker();
 * // Returns readonly array of all test projects created during test session
 */

import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import type { TestProject } from '../../../contracts/test-project/test-project-contract';

export const integrationEnvironmentListBroker = (): readonly TestProject[] =>
  integrationEnvironmentTrackingBroker.getAll();

/**
 * PURPOSE: Lists all created integration test environments for inspection
 *
 * USAGE:
 * const environments = integrationEnvironmentListBroker();
 * // Returns readonly array of all test projects created during test session
 */

import { integrationEnvironmentTrackingBroker } from '../tracking/integration-environment-tracking-broker';
import type { TestGuild } from '../../../contracts/test-guild/test-guild-contract';

export const integrationEnvironmentListBroker = (): readonly TestGuild[] =>
  integrationEnvironmentTrackingBroker.getAll();

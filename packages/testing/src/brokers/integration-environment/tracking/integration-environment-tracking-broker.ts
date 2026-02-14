/**
 * PURPOSE: Internal broker for tracking created integration test environments
 *
 * USAGE:
 * import { integrationEnvironmentTrackingBroker } from './integration-environment-tracking-broker';
 * integrationEnvironmentTrackingBroker.add(project);
 * integrationEnvironmentTrackingBroker.getAll();
 * // Internal use only - manages global tracking for automatic cleanup
 */

import type { TestGuild } from '../../../contracts/test-guild/test-guild-contract';

const createdEnvironments: TestGuild[] = [];

export const integrationEnvironmentTrackingBroker = {
  add: ({ guild }: { guild: TestGuild }): void => {
    createdEnvironments.push(guild);
  },

  getAll: (): readonly TestGuild[] => createdEnvironments,

  clear: (): void => {
    createdEnvironments.length = 0;
  },
};

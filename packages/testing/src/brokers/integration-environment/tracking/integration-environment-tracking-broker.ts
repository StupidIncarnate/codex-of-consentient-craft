/**
 * PURPOSE: Internal broker for tracking created integration test environments
 *
 * USAGE:
 * import { integrationEnvironmentTrackingBroker } from './integration-environment-tracking-broker';
 * integrationEnvironmentTrackingBroker.add(project);
 * integrationEnvironmentTrackingBroker.getAll();
 * // Internal use only - manages global tracking for automatic cleanup
 */

import type { TestProject } from '../../../contracts/test-project/test-project-contract';

const createdEnvironments: TestProject[] = [];

export const integrationEnvironmentTrackingBroker = {
  add: ({ project }: { project: TestProject }): void => {
    createdEnvironments.push(project);
  },

  getAll: (): readonly TestProject[] => createdEnvironments,

  clear: (): void => {
    createdEnvironments.length = 0;
  },
};

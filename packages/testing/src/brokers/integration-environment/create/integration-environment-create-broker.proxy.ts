/**
 * PURPOSE: Empty proxy for integration-environment-create-broker
 *
 * USAGE:
 * const proxy = integrationEnvironmentCreateBrokerProxy();
 * // Empty proxy - broker uses real fs/path/execSync for integration testing
 */

export const integrationEnvironmentCreateBrokerProxy = (): Record<PropertyKey, never> => ({});

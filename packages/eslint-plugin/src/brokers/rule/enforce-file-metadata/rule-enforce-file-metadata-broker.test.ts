import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceFileMetadataBroker } from './rule-enforce-file-metadata-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-file-metadata', ruleEnforceFileMetadataBroker(), {
  valid: [
    {
      code: `/**
 * PURPOSE: Checks if user has admin permissions
 *
 * USAGE:
 * const isAdmin = hasAdminGuard({ user });
 * // Returns true if user is admin
 */
export const hasAdminGuard = ({ user }) => {
  return user.role === 'admin';
};`,
      filename: 'src/guards/has-admin/has-admin-guard.ts',
    },
    {
      code: `/**
 * PURPOSE: Transforms user data to DTO format
 *
 * USAGE:
 * const dto = userToDtoTransformer({ user });
 *
 * RELATED: user-contract, user-dto-contract
 */
export const userToDtoTransformer = ({ user }) => {
  return { id: user.id, name: user.name };
};`,
      filename: 'src/transformers/user-to-dto/user-to-dto-transformer.ts',
    },
    {
      code: `/**
 * PURPOSE: Fetches user data from API
 *
 * USAGE:
 * const user = await userFetchBroker({ userId });
 * if (user) {
 *   console.log(user.name);
 * }
 * // Returns User object or throws error
 *
 * RELATED: http-adapter, user-contract
 */
export const userFetchBroker = async ({ userId }) => {
  return await fetch(\`/api/users/\${userId}\`);
};`,
      filename: 'src/brokers/user/fetch/user-fetch-broker.ts',
    },
    // Test files should be skipped
    {
      code: `export const test = () => {};`,
      filename: 'src/guards/has-admin/has-admin-guard.test.ts',
    },
    // Proxy files should be skipped
    {
      code: `export const proxy = () => ({});`,
      filename: 'src/guards/has-admin/has-admin-guard.proxy.ts',
    },
    // Stub files should be skipped
    {
      code: `export const UserStub = () => ({});`,
      filename: 'src/contracts/user/user.stub.ts',
    },
    // Integration test files should be skipped
    {
      code: `export const test = () => {};`,
      filename: 'src/startup/start-server.integration.test.ts',
    },
  ],
  invalid: [
    {
      code: `export const hasAdminGuard = ({ user }) => {
  return user.role === 'admin';
};`,
      filename: 'src/guards/has-admin/has-admin-guard.ts',
      errors: [{ messageId: 'missingMetadata' }],
    },
    {
      code: `/**
 * Just a regular comment without metadata fields
 */
export const userFetchBroker = async ({ userId }) => {
  return await fetch(\`/api/users/\${userId}\`);
};`,
      filename: 'src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingMetadata' }],
    },
    {
      code: `/**
 * PURPOSE: Only has PURPOSE, missing USAGE
 */
export const transformer = ({ data }) => {
  return data;
};`,
      filename: 'src/transformers/data/data-transformer.ts',
      errors: [{ messageId: 'missingMetadata' }],
    },
    {
      code: `/**
 * USAGE: Only has USAGE, missing PURPOSE
 * const result = guard({ value });
 */
export const guard = ({ value }) => {
  return Boolean(value);
};`,
      filename: 'src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'missingMetadata' }],
    },
    {
      code: `/**
 * PURPOSE:
 *
 * USAGE:
 * code();
 */
export const emptyFields = () => {};`,
      filename: 'src/brokers/empty/empty-broker.ts',
      errors: [{ messageId: 'missingMetadata' }],
    },
  ],
});

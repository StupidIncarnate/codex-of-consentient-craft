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
    // NEW: Copyright header before metadata (no imports) should be allowed
    {
      code: `// Copyright header
// Some rights reserved

/**
 * PURPOSE: Validates email format
 *
 * USAGE:
 * const isValid = emailValidator({ email });
 * // Returns true if email is valid
 */
export const emailValidator = ({ email }) => {
  return email.includes('@');
};`,
      filename: 'src/guards/email-validator/email-validator-guard.ts',
    },
    // NEW: Whitespace before metadata (no imports) should be allowed
    {
      code: `

/**
 * PURPOSE: Calculates total price
 *
 * USAGE:
 * const total = calculateTotal({ items });
 * // Returns sum of all item prices
 */
export const calculateTotal = ({ items }) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};`,
      filename: 'src/transformers/calculate-total/calculate-total-transformer.ts',
    },
    // NEW: Multiple comments before metadata (no imports) should be allowed
    {
      code: `/* eslint-disable */
// Some configuration
// More comments

/**
 * PURPOSE: Helper utility function
 *
 * USAGE:
 * const result = helperUtil({ data });
 * // Returns processed data
 */
export const helperUtil = ({ data }) => {
  return data;
};`,
      filename: 'src/guards/helper-util/helper-util-guard.ts',
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
    {
      code: `import { User } from './user';

/**
 * PURPOSE: Checks if user has admin permissions
 *
 * USAGE:
 * const isAdmin = hasAdminGuard({ user });
 * // Returns true if user is admin
 */
export const hasAdminGuard = ({ user }) => {
  return user.role === 'admin';
};`,
      output: `/**
 * PURPOSE: Checks if user has admin permissions
 *
 * USAGE:
 * const isAdmin = hasAdminGuard({ user });
 * // Returns true if user is admin
 */
import { User } from './user';

export const hasAdminGuard = ({ user }) => {
  return user.role === 'admin';
};`,
      filename: 'src/guards/has-admin/has-admin-guard.ts',
      errors: [{ messageId: 'metadataNotBeforeImports' }],
    },
    {
      code: `// Some other comment
import { fetch } from 'http';

/**
 * PURPOSE: Fetches user data from API
 *
 * USAGE:
 * const user = await userFetchBroker({ userId });
 * // Returns User object or throws error
 */
export const userFetchBroker = async ({ userId }) => {
  return await fetch(\`/api/users/\${userId}\`);
};`,
      output: `/**
 * PURPOSE: Fetches user data from API
 *
 * USAGE:
 * const user = await userFetchBroker({ userId });
 * // Returns User object or throws error
 */
// Some other comment
import { fetch } from 'http';

export const userFetchBroker = async ({ userId }) => {
  return await fetch(\`/api/users/\${userId}\`);
};`,
      filename: 'src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'metadataNotBeforeImports' }],
    },
    {
      code: `import type { User } from './user-contract';
import { z } from 'zod';

/**
 * PURPOSE: Transforms user data to DTO format
 *
 * USAGE:
 * const dto = userToDtoTransformer({ user });
 */
export const userToDtoTransformer = ({ user }) => {
  return { id: user.id, name: user.name };
};`,
      output: `/**
 * PURPOSE: Transforms user data to DTO format
 *
 * USAGE:
 * const dto = userToDtoTransformer({ user });
 */
import type { User } from './user-contract';
import { z } from 'zod';

export const userToDtoTransformer = ({ user }) => {
  return { id: user.id, name: user.name };
};`,
      filename: 'src/transformers/user-to-dto/user-to-dto-transformer.ts',
      errors: [{ messageId: 'metadataNotBeforeImports' }],
    },
    {
      code: `import { z } from 'zod';
import type { Config } from './config-contract';

// Helper function
const helper = () => {};

/**
 * PURPOSE: Loads configuration from file
 *
 * USAGE:
 * const config = await loadConfig({ path });
 * // Returns parsed configuration object
 */
export const loadConfig = async ({ path }) => {
  return {};
};`,
      output: `/**
 * PURPOSE: Loads configuration from file
 *
 * USAGE:
 * const config = await loadConfig({ path });
 * // Returns parsed configuration object
 */
import { z } from 'zod';
import type { Config } from './config-contract';

// Helper function
const helper = () => {};

export const loadConfig = async ({ path }) => {
  return {};
};`,
      filename: 'src/brokers/config/load/config-load-broker.ts',
      errors: [{ messageId: 'metadataNotBeforeImports' }],
    },
    {
      code: `/* Block comment before imports */
import { readFile } from 'fs/promises';

/**
 * PURPOSE: Reads file contents
 *
 * USAGE:
 * const content = await fileReader({ path });
 * // Returns file contents as string
 */
export const fileReader = async ({ path }) => {
  return await readFile(path, 'utf-8');
};`,
      output: `/**
 * PURPOSE: Reads file contents
 *
 * USAGE:
 * const content = await fileReader({ path });
 * // Returns file contents as string
 */
/* Block comment before imports */
import { readFile } from 'fs/promises';

export const fileReader = async ({ path }) => {
  return await readFile(path, 'utf-8');
};`,
      filename: 'src/adapters/file-reader/file-reader-adapter.ts',
      errors: [{ messageId: 'metadataNotBeforeImports' }],
    },
  ],
});

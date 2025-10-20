import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleJestMockedMustImportBroker } from './rule-jest-mocked-must-import-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('jest-mocked-must-import', ruleJestMockedMustImportBroker(), {
  valid: [
    // ✅ CORRECT: Default import with jest.mocked()
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
    },

    // ✅ CORRECT: Named import with jest.mocked()
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsReadFileAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-read-file-adapter.proxy.ts',
    },

    // ✅ CORRECT: Namespace import with jest.mocked()
    {
      code: `
        import * as fs from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mockFs = jest.mocked(fs);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },

    // ✅ CORRECT: Multiple imports with jest.mocked()
    {
      code: `
        import axios from 'axios';
        import { readFile } from 'fs/promises';
        jest.mock('axios');
        jest.mock('fs/promises');

        export const multiAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/multi/multi-adapter.proxy.ts',
    },

    // ✅ CORRECT: State proxy importing Redis client
    {
      code: `
        import { createClient } from 'redis';
        jest.mock('redis');

        export const redisStateProxy = () => {
          const mockCreateClient = jest.mocked(createClient);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/state/redis/redis-state.proxy.ts',
    },

    // ✅ Non-proxy files should be ignored
    {
      code: `
        export const httpAdapterTest = () => {
          const mockAxios = jest.mocked(axios);
          return { /* test code */ };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.test.ts',
    },

    // ✅ CORRECT: Relative import with jest.mocked()
    {
      code: `
        import { httpAdapter } from '../../../adapters/http/http-adapter';
        jest.mock('../../../adapters/http/http-adapter');

        export const someProxy = () => {
          const mockAdapter = jest.mocked(httpAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/some/path/some.proxy.ts',
    },

    // ✅ CORRECT: Import alias with jest.mocked()
    {
      code: `
        import { readFile as readFileAsync } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFileAsync);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },

    // ✅ CORRECT: Adapter proxy mocking npm package (node: prefix)
    {
      code: `
        import { readFile } from 'node:fs/promises';
        jest.mock('node:fs/promises');

        export const fsAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },

    // ✅ CORRECT: Adapter proxy mocking Redis
    {
      code: `
        import { createClient } from 'redis';
        jest.mock('redis');

        export const redisAdapterProxy = () => {
          const mockCreateClient = jest.mocked(createClient);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/redis/redis-adapter.proxy.ts',
    },

    // ✅ CORRECT: Adapter proxy mocking database client
    {
      code: `
        import { Client } from 'pg';
        jest.mock('pg');

        export const postgresAdapterProxy = () => {
          const mockClient = jest.mocked(Client);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/postgres/postgres-adapter.proxy.ts',
    },

    // ✅ CORRECT: Non-adapter proxy can mock adapters (business logic delegates to adapters)
    {
      code: `
        import { httpAdapter } from '../../../adapters/http/http-adapter';
        jest.mock('../../../adapters/http/http-adapter');

        export const userBrokerProxy = () => {
          const mockAdapter = jest.mocked(httpAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
  ],

  invalid: [
    // ❌ WRONG: Using jest.mocked() without importing - default import
    {
      code: `
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'axios',
            importStatement: "axios from 'axios'",
          },
        },
      ],
    },

    // ❌ WRONG: Using jest.mocked() without importing - named import
    {
      code: `
        jest.mock('fs/promises');

        export const fsReadFileAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-read-file-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'readFile',
            importStatement: "readFile from 'readFile'",
          },
        },
      ],
    },

    // ❌ WRONG: Typo in jest.mocked() argument
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = jest.mocked(axois);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'axois',
            importStatement: "axois from 'axois'",
          },
        },
      ],
    },

    // ❌ WRONG: Multiple jest.mocked() calls, one missing import
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');
        jest.mock('fs/promises');

        export const multiAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/multi/multi-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'readFile',
            importStatement: "readFile from 'readFile'",
          },
        },
      ],
    },

    // ❌ WRONG: State proxy missing Redis import
    {
      code: `
        jest.mock('redis');

        export const redisStateProxy = () => {
          const mockClient = jest.mocked(RedisClient);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/state/redis/redis-state.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'RedisClient',
            importStatement: "RedisClient from 'RedisClient'",
          },
        },
      ],
    },

    // ❌ WRONG: Wrong import name used in jest.mocked()
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mockWrite = jest.mocked(writeFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'writeFile',
            importStatement: "writeFile from 'writeFile'",
          },
        },
      ],
    },

    // ❌ WRONG: Case sensitivity - wrong case
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = jest.mocked(Axios);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'Axios',
            importStatement: "Axios from 'Axios'",
          },
        },
      ],
    },

    // ❌ WRONG: Using original name when import has alias
    {
      code: `
        import { readFile as readFileAsync } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockedNotImported',
          data: {
            name: 'readFile',
            importStatement: "readFile from 'readFile'",
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking the adapter itself
    {
      code: `
        import { httpAdapter } from './http-adapter';
        jest.mock('./http-adapter');

        export const httpAdapterProxy = () => {
          const mockAdapter = jest.mocked(httpAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockingAdapter',
          data: {
            name: 'httpAdapter',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking business logic (broker)
    {
      code: `
        import { userBroker } from '../../brokers/user/user-broker';
        jest.mock('../../brokers/user/user-broker');

        export const someAdapterProxy = () => {
          const mockBroker = jest.mocked(userBroker);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/some/some-adapter.proxy.ts',
      errors: [
        {
          messageId: 'notNpmPackage',
          data: {
            name: 'userBroker',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking another adapter
    {
      code: `
        import { dbAdapter } from '../db/db-adapter';
        jest.mock('../db/db-adapter');

        export const cacheAdapterProxy = () => {
          const mockDb = jest.mocked(dbAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/cache/cache-adapter.proxy.ts',
      errors: [
        {
          messageId: 'mockingAdapter',
          data: {
            name: 'dbAdapter',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking transformer
    {
      code: `
        import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';
        jest.mock('../../transformers/format-date/format-date-transformer');

        export const dateAdapterProxy = () => {
          const mockFormat = jest.mocked(formatDateTransformer);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/date/date-adapter.proxy.ts',
      errors: [
        {
          messageId: 'notNpmPackage',
          data: {
            name: 'formatDateTransformer',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking guard
    {
      code: `
        import { hasPermissionGuard } from '../../guards/has-permission/has-permission-guard';
        jest.mock('../../guards/has-permission/has-permission-guard');

        export const authAdapterProxy = () => {
          const mockGuard = jest.mocked(hasPermissionGuard);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/auth/auth-adapter.proxy.ts',
      errors: [
        {
          messageId: 'notNpmPackage',
          data: {
            name: 'hasPermissionGuard',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking contract/stub
    {
      code: `
        import { UserStub } from '../../contracts/user/user.stub';
        jest.mock('../../contracts/user/user.stub');

        export const userAdapterProxy = () => {
          const mockStub = jest.mocked(UserStub);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/user/user-adapter.proxy.ts',
      errors: [
        {
          messageId: 'notNpmPackage',
          data: {
            name: 'UserStub',
          },
        },
      ],
    },

    // ❌ WRONG: Adapter proxy mocking @questmaestro workspace package
    {
      code: `
        import { sharedContract } from '@questmaestro/shared';
        jest.mock('@questmaestro/shared');

        export const sharedAdapterProxy = () => {
          const mockShared = jest.mocked(sharedContract);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/shared/shared-adapter.proxy.ts',
      errors: [
        {
          messageId: 'notNpmPackage',
          data: {
            name: 'sharedContract',
          },
        },
      ],
    },
  ],
});

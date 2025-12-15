import { IdentifierStub, ModulePathStub } from '@dungeonmaster/shared/contracts';
import { parseImplementationImportsTransformer } from './parse-implementation-imports-transformer';

describe('parseImplementationImportsTransformer', () => {
  it('should parse named imports from architectural components', () => {
    const content = `
      import { httpAdapter } from '../../adapters/http/http-adapter';
      import { dbAdapter } from '../../adapters/db/db-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
    expect(result.get(IdentifierStub({ value: 'dbAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/db/db-adapter' }),
    );
  });

  it('should parse default imports from architectural components', () => {
    const content = `
      import httpAdapter from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should skip npm package imports', () => {
    const content = `
      import axios from 'axios';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should skip contract imports', () => {
    const content = `
      import type { User } from '../../contracts/user/user-contract';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should skip statics imports', () => {
    const content = `
      import { userStatics } from '../../statics/user/user-statics';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should skip stub imports', () => {
    const content = `
      import { UserStub } from '../../contracts/user/user.stub';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should skip multi-dot files except .proxy', () => {
    const content = `
      import { userTest } from '../../brokers/user/user-broker.test';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should include .proxy imports', () => {
    const content = `
      import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapterProxy' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter.proxy' }),
    );
  });

  it('should skip imports from folders that do not require proxies', () => {
    const content = `
      import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should strip comments before parsing', () => {
    const content = `
      // import { fakeAdapter } from '../../adapters/fake/fake-adapter';
      /* import { commentAdapter } from '../../adapters/comment/comment-adapter'; */
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should handle multiple imports on same line', () => {
    const content = `
      import { httpAdapter, dbAdapter } from '../../adapters/data/data-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/data/data-adapter' }),
    );
    expect(result.get(IdentifierStub({ value: 'dbAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/data/data-adapter' }),
    );
  });

  it('should handle imports with "as" aliases', () => {
    const content = `
      import { httpAdapter as http } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should return empty map when no valid imports', () => {
    const content = `
      import axios from 'axios';
      const foo = 'bar';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(0);
  });

  it('should parse scoped package imports with folder type subpath requiring proxies', () => {
    const content = `
      import { userBroker } from '@dungeonmaster/shared/brokers';
      import { httpAdapter } from '@dungeonmaster/shared/adapters';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get(IdentifierStub({ value: 'userBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@dungeonmaster/shared/brokers' }),
    );
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '@dungeonmaster/shared/adapters' }),
    );
  });

  it('should skip scoped package imports with folder type subpath not requiring proxies', () => {
    const content = `
      import { userContract } from '@dungeonmaster/shared/contracts';
      import { userStatics } from '@dungeonmaster/shared/statics';
      import { httpAdapter } from '@dungeonmaster/shared/adapters';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '@dungeonmaster/shared/adapters' }),
    );
  });

  it('should skip scoped package imports without folder type subpath', () => {
    const content = `
      import { something } from '@dungeonmaster/shared';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should handle multiple imports from scoped package with folder type subpath', () => {
    const content = `
      import { userBroker, authBroker } from '@dungeonmaster/shared/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get(IdentifierStub({ value: 'userBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@dungeonmaster/shared/brokers' }),
    );
    expect(result.get(IdentifierStub({ value: 'authBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@dungeonmaster/shared/brokers' }),
    );
  });

  it('should skip default imports from scoped packages with folder type subpath', () => {
    const content = `
      import defaultExport from '@dungeonmaster/shared/brokers';
      import { httpAdapter } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('should parse scoped package imports with different package names requiring proxies', () => {
    const content = `
      import { userBroker } from '@acme/core/brokers';
      import { httpAdapter } from '@myorg/utils/adapters';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get(IdentifierStub({ value: 'userBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@acme/core/brokers' }),
    );
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '@myorg/utils/adapters' }),
    );
  });

  it('should skip scoped package imports with different package names not requiring proxies', () => {
    const content = `
      import { userContract } from '@acme/core/contracts';
      import { userStatics } from '@myorg/utils/statics';
      import { httpAdapter } from '@acme/core/adapters';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '@acme/core/adapters' }),
    );
  });

  it('should handle multiple imports from different scoped packages with folder type subpath', () => {
    const content = `
      import { userBroker, authBroker } from '@acme/core/brokers';
      import { logAdapter } from '@myorg/utils/adapters';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(3);
    expect(result.get(IdentifierStub({ value: 'userBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@acme/core/brokers' }),
    );
    expect(result.get(IdentifierStub({ value: 'authBroker' }))).toStrictEqual(
      ModulePathStub({ value: '@acme/core/brokers' }),
    );
    expect(result.get(IdentifierStub({ value: 'logAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '@myorg/utils/adapters' }),
    );
  });
});

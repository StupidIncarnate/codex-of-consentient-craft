import { IdentifierStub, ModulePathStub } from '@questmaestro/shared/contracts';
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
});

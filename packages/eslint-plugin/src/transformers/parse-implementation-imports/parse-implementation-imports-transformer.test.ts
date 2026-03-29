import { IdentifierStub, ModulePathStub } from '@dungeonmaster/shared/contracts';
import { parseImplementationImportsTransformer } from './parse-implementation-imports-transformer';

describe('parseImplementationImportsTransformer', () => {
  it('VALID: {content: named imports from adapters} => parses both adapter imports', () => {
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

  it('VALID: {content: default import from adapter} => parses default import', () => {
    const content = `
      import httpAdapter from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('EDGE: {content: npm package + adapter import} => skips npm package import', () => {
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

  it('EDGE: {content: contract import + adapter import} => skips contract import', () => {
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

  it('EDGE: {content: statics import + adapter import} => skips statics import', () => {
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

  it('EDGE: {content: stub import + adapter import} => skips stub import', () => {
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

  it('EDGE: {content: .test import + adapter import} => skips multi-dot files except .proxy', () => {
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

  it('VALID: {content: .proxy import} => includes .proxy imports', () => {
    const content = `
      import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapterProxy' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter.proxy' }),
    );
  });

  it('VALID: {content: .tsx extension import} => includes tsx imports', () => {
    const content = `
      import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter.tsx';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'inkBoxAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/ink/box/ink-box-adapter.tsx' }),
    );
  });

  it('VALID: {content: .jsx extension import} => includes jsx imports', () => {
    const content = `
      import { reactAdapter } from '../../adapters/react/react-adapter.jsx';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'reactAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/react/react-adapter.jsx' }),
    );
  });

  it('EDGE: {content: transformer import + adapter import} => skips non-proxy folders', () => {
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

  it('EDGE: {content: commented imports + real import} => strips comments before parsing', () => {
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

  it('VALID: {content: multiple named imports on same line} => parses all identifiers', () => {
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

  it('EDGE: {content: import with "as" alias} => uses original identifier name', () => {
    const content = `
      import { httpAdapter as http } from '../../adapters/http/http-adapter';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get(IdentifierStub({ value: 'httpAdapter' }))).toStrictEqual(
      ModulePathStub({ value: '../../adapters/http/http-adapter' }),
    );
  });

  it('EMPTY: {content: only npm imports} => returns empty map', () => {
    const content = `
      import axios from 'axios';
      const foo = 'bar';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(0);
  });

  it('VALID: {content: scoped package imports with proxy-requiring subpath} => parses imports', () => {
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

  it('EDGE: {content: scoped package non-proxy subpath + proxy subpath} => skips non-proxy subpath', () => {
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

  it('EDGE: {content: scoped package without subpath} => skips import without folder type', () => {
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

  it('VALID: {content: multiple imports from scoped package brokers subpath} => parses all', () => {
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

  it('EDGE: {content: default import from scoped package with subpath} => skips default import', () => {
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

  it('VALID: {content: scoped imports from different package names} => parses proxy-requiring imports', () => {
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

  it('EDGE: {content: scoped non-proxy imports from different packages} => skips non-proxy subpaths', () => {
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

  it('VALID: {content: multiple imports from different scoped packages} => parses all proxy-requiring', () => {
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

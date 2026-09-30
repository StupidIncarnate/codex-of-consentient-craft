import { parseImplementationImportsTransformer } from './parse-implementation-imports-transformer';

describe('parseImplementationImportsTransformer', () => {
  it('VALID: {content: named imports from brokers} => parses both broker imports', () => {
    const content = `
      import { httpBroker } from '../../brokers/http/http-broker';
      import { dbBroker } from '../../brokers/db/db-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
    expect(result.get('dbBroker')).toStrictEqual(
      '../../brokers/db/db-broker',
    );
  });

  it('VALID: {content: default import from broker} => parses default import', () => {
    const content = `
      import httpBroker from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: npm package + broker import} => skips npm package import', () => {
    const content = `
      import axios from 'axios';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: contract import + broker import} => skips contract import', () => {
    const content = `
      import type { User } from '../../contracts/user/user-contract';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: statics import + broker import} => skips statics import', () => {
    const content = `
      import { userStatics } from '../../statics/user/user-statics';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: stub import + broker import} => skips stub import', () => {
    const content = `
      import { UserStub } from '../../contracts/user/user.stub';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: .test import + broker import} => skips multi-dot files except .proxy', () => {
    const content = `
      import { userTest } from '../../brokers/user/user-broker.test';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('VALID: {content: .proxy import} => includes .proxy imports', () => {
    const content = `
      import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBrokerProxy')).toStrictEqual(
      '../../brokers/http/http-broker.proxy',
    );
  });

  it('VALID: {content: .tsx extension import} => includes tsx imports', () => {
    const content = `
      import { inkBoxBroker } from '../../brokers/ink/box/ink-box-broker.tsx';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('inkBoxBroker')).toStrictEqual(
      '../../brokers/ink/box/ink-box-broker.tsx',
    );
  });

  it('VALID: {content: .jsx extension import} => includes jsx imports', () => {
    const content = `
      import { reactBroker } from '../../brokers/react/react-broker.jsx';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('reactBroker')).toStrictEqual(
      '../../brokers/react/react-broker.jsx',
    );
  });

  it('EDGE: {content: transformer import + broker import} => skips non-proxy folders', () => {
    const content = `
      import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: commented imports + real import} => strips comments before parsing', () => {
    const content = `
      // import { fakeBroker } from '../../brokers/fake/fake-broker';
      /* import { commentBroker } from '../../brokers/comment/comment-broker'; */
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('VALID: {content: multiple named imports on same line} => parses all identifiers', () => {
    const content = `
      import { httpBroker, dbBroker } from '../../brokers/data/data-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/data/data-broker',
    );
    expect(result.get('dbBroker')).toStrictEqual(
      '../../brokers/data/data-broker',
    );
  });

  it('EDGE: {content: import with "as" alias} => uses original identifier name', () => {
    const content = `
      import { httpBroker as http } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('VALID: {content: mixed named import with per-name type prefix} => keeps the value, excludes the type', () => {
    const content = `
      import { walkBroker, type WalkMemo } from '../../brokers/walk/walk-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('walkBroker')).toStrictEqual(
      '../../brokers/walk/walk-broker',
    );
    expect(result.get('WalkMemo')).toBe(undefined);
  });

  it('EDGE: {content: whole-statement type import from a proxy-requiring path} => excludes every name in it', () => {
    const content = `
      import type { WalkMemo } from '../../brokers/walk/walk-broker';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
    expect(result.get('WalkMemo')).toBe(undefined);
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
      import { httpBroker } from '@dungeonmaster/shared/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('userBroker')).toStrictEqual(
      '@dungeonmaster/shared/brokers',
    );
    expect(result.get('httpBroker')).toStrictEqual(
      '@dungeonmaster/shared/brokers',
    );
  });

  it('EDGE: {content: scoped package non-proxy subpath + proxy subpath} => skips non-proxy subpath', () => {
    const content = `
      import { userContract } from '@dungeonmaster/shared/contracts';
      import { userStatics } from '@dungeonmaster/shared/statics';
      import { httpBroker } from '@dungeonmaster/shared/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '@dungeonmaster/shared/brokers',
    );
  });

  it('EDGE: {content: a bare workspace-package ROOT import, no subpath at all, workspaceScope given} => records it, since enforce-proxy-child-creation decides per name whether it needs a proxy', () => {
    const content = `
      import { something } from '@dungeonmaster/shared';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({
      content,
      workspaceScope: '@dungeonmaster',
    });

    expect(result.size).toBe(2);
    expect(result.get('something')).toStrictEqual(
      '@dungeonmaster/shared',
    );
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it("EDGE: {content: a bare root import, workspaceScope: '@acme'} => records it under a CONSUMER's own scope, never '@dungeonmaster'", () => {
    const content = `
      import { OrdersBroker } from '@acme/orders';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content, workspaceScope: '@acme' });

    expect(result.size).toBe(2);
    expect(result.get('OrdersBroker')).toStrictEqual(
      '@acme/orders',
    );
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EMPTY: {content: a bare workspace-package ROOT import, no workspaceScope given at all} => skips it — a repo with no discoverable workspace scope has no bare-root form to recognize', () => {
    const content = `
      import { something } from '@dungeonmaster/shared';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('EDGE: {content: a bare root import to one of the four gateway packages} => still records it via the gateway branch, unaffected by the new workspace-package-root branch added after it', () => {
    const content = `
      import { z } from '@dungeonmaster/npm';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('z')).toStrictEqual(
      '@dungeonmaster/npm',
    );
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('VALID: {content: multiple imports from scoped package brokers subpath} => parses all', () => {
    const content = `
      import { userBroker, authBroker } from '@dungeonmaster/shared/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('userBroker')).toStrictEqual(
      '@dungeonmaster/shared/brokers',
    );
    expect(result.get('authBroker')).toStrictEqual(
      '@dungeonmaster/shared/brokers',
    );
  });

  it('EDGE: {content: default import from scoped package with subpath} => skips default import', () => {
    const content = `
      import defaultExport from '@dungeonmaster/shared/brokers';
      import { httpBroker } from '../../brokers/http/http-broker';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '../../brokers/http/http-broker',
    );
  });

  it('VALID: {content: scoped imports from different package names} => parses proxy-requiring imports', () => {
    const content = `
      import { userBroker } from '@acme/core/brokers';
      import { httpBroker } from '@myorg/utils/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('userBroker')).toStrictEqual(
      '@acme/core/brokers',
    );
    expect(result.get('httpBroker')).toStrictEqual(
      '@myorg/utils/brokers',
    );
  });

  it('EDGE: {content: scoped non-proxy imports from different packages} => skips non-proxy subpaths', () => {
    const content = `
      import { userContract } from '@acme/core/contracts';
      import { userStatics } from '@myorg/utils/statics';
      import { httpBroker } from '@acme/core/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('httpBroker')).toStrictEqual(
      '@acme/core/brokers',
    );
  });

  it('VALID: {content: gateway import at a deep subpath} => parses imports regardless of depth', () => {
    const content = `
      import { readJsonFileIfExists, writeFile } from '@dungeonmaster/node/fs/promises';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('readJsonFileIfExists')).toStrictEqual(
      '@dungeonmaster/node/fs/promises',
    );
    expect(result.get('writeFile')).toStrictEqual(
      '@dungeonmaster/node/fs/promises',
    );
  });

  it('VALID: {content: gateway pass-through import} => parses the import even though it needs no proxy', () => {
    const content = `
      import { z } from '@dungeonmaster/npm/zod';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('z')).toStrictEqual(
      '@dungeonmaster/npm/zod',
    );
  });

  it('VALID: {content: #gateway import at a deep subpath} => parses imports regardless of depth', () => {
    const content = `
      import { readJsonFileIfExists, writeFile } from '#gateway/node/fs/promises';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(2);
    expect(result.get('readJsonFileIfExists')).toStrictEqual(
      '#gateway/node/fs/promises',
    );
    expect(result.get('writeFile')).toStrictEqual(
      '#gateway/node/fs/promises',
    );
  });

  it('VALID: {content: #gateway pass-through import} => parses the import even though it needs no proxy', () => {
    const content = `
      import { z } from '#gateway/npm/zod';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(1);
    expect(result.get('z')).toStrictEqual(
      '#gateway/npm/zod',
    );
  });

  it('VALID: {content: multiple imports from different scoped packages} => parses all proxy-requiring', () => {
    const content = `
      import { userBroker, authBroker } from '@acme/core/brokers';
      import { logBroker } from '@myorg/utils/brokers';
    `;

    const result = parseImplementationImportsTransformer({ content });

    expect(result.size).toBe(3);
    expect(result.get('userBroker')).toStrictEqual(
      '@acme/core/brokers',
    );
    expect(result.get('authBroker')).toStrictEqual(
      '@acme/core/brokers',
    );
    expect(result.get('logBroker')).toStrictEqual(
      '@myorg/utils/brokers',
    );
  });
});

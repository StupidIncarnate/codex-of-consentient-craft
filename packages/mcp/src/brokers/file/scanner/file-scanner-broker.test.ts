import { fileScannerBroker } from './file-scanner-broker';
import { fileScannerBrokerProxy } from './file-scanner-broker.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';

describe('fileScannerBroker', () => {
  describe('no filters', () => {
    it('VALID: {} => returns all matched files with metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/guards/has-permission-guard.ts';
      const pattern = '**/*';
      const contents = `/**
 * PURPOSE: Validates that user has permission to edit resource
 *
 * USAGE:
 * if (hasPermissionGuard({ user, resource })) {
 *   // User can edit
 * }
 */
export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean => {
  return user?.permissions.includes(resource?.requiredPermission);
};`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates that user has permission to edit resource',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'resource?': 'Resource', 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'if (hasPermissionGuard({ user, resource })) {\n// User can edit\n}',
        },
      ]);
    });

    it('VALID: files without PURPOSE/USAGE => still returned with undefined metadata', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/transformers/plain-transformer.ts';
      const pattern = '**/*';
      const contents = `export const plainTransformer = () => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'transformer',
          metadata: undefined,
          name: 'plain-transformer',
          path: '/project/src/transformers/plain-transformer.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });

    it('VALID: files without exported function => still returned (no gate)', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/guards/no-export-guard.ts';
      const pattern = '**/*';
      const contents = `/**
 * PURPOSE: Validates something
 * USAGE: example
 */
const privateFunction = () => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'no-export-guard',
          path: '/project/src/guards/no-export-guard.ts',
          purpose: 'Validates something',
          relatedFiles: [],
          signature: undefined,
          usage: 'example',
        },
      ]);
    });
  });

  describe('glob filter', () => {
    it('VALID: {glob: "**/*.ts"} => glob with extension used as-is', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/guards/has-permission-guard.ts';
      const pattern = '**/*.ts';
      const contents = `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`;
      const { glob } = DiscoverInputStub({ glob: '**/*.ts' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ glob: glob! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates permission',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'hasPermissionGuard({ user })',
        },
      ]);
    });
  });

  describe('grep filter', () => {
    it('VALID: {grep: "permission"} => returns files with matching content and hits', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/guards/has-permission-guard.ts';
      const pattern = '**/*';
      const contents = `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */
export const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;`;
      const { grep } = DiscoverInputStub({ grep: 'permission' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          hits: [{ line: 2, text: ' * PURPOSE: Validates permission' }],
          metadata: {},
          name: 'has-permission-guard',
          path: '/project/src/guards/has-permission-guard.ts',
          purpose: 'Validates permission',
          relatedFiles: [],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { 'user?': 'User' },
              },
            ],
            raw: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'hasPermissionGuard({ user })',
        },
      ]);
    });

    it('EMPTY: {grep: "nonexistent"} => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/guards/has-permission-guard.ts';
      const pattern = '**/*';
      const contents = `export const hasPermissionGuard = (): boolean => true;`;
      const { grep } = DiscoverInputStub({ grep: 'nonexistent' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {grep matches proxy/test only} => implementation sibling still included without hits', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const implPath =
        '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.ts';
      const proxyPath =
        '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.proxy.ts';
      const testPath =
        '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.test.ts';

      // Impl file uses camelCase name only — the kebab "explicit-return-types" never appears
      const implContents = `/**
 * PURPOSE: Rule that enforces explicit return types on exported functions
 * USAGE: ruleExplicitReturnTypesBroker()
 */
export const ruleExplicitReturnTypesBroker = (): boolean => true;`;

      // Proxy comment mentions the kebab rule name
      const proxyContents = `/** Proxy for explicit-return-types rule broker. */
export const ruleExplicitReturnTypesBrokerProxy = () => ({});`;

      // Test uses the kebab rule name inside ruleTester.run
      const testContents = `import { ruleExplicitReturnTypesBroker } from './rule-explicit-return-types-broker';
describe('rule', () => {
  ruleTester.run('explicit-return-types', ruleExplicitReturnTypesBroker(), {});
});`;

      const { grep, strict } = DiscoverInputStub({
        grep: 'explicit-return-types',
        strict: true,
      });

      proxy.setupFiles({
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: proxyPath, contents: proxyContents },
          { filepath: testPath, contents: testContents },
        ],
        pattern,
      });

      const results = await fileScannerBroker({ grep: grep!, strict: strict! });

      expect(results).toStrictEqual([
        {
          fileType: 'broker',
          metadata: {},
          name: 'rule-explicit-return-types-broker',
          path: '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.ts',
          purpose: 'Rule that enforces explicit return types on exported functions',
          relatedFiles: [
            'rule-explicit-return-types-broker.proxy.ts',
            'rule-explicit-return-types-broker.test.ts',
          ],
          signature: {
            parameters: [],
            raw: 'export const ruleExplicitReturnTypesBroker = (): boolean =>',
            returnType: 'boolean',
          },
          usage: 'ruleExplicitReturnTypesBroker()',
        },
        {
          fileType: 'broker',
          hits: [{ line: 1, text: '/** Proxy for explicit-return-types rule broker. */' }],
          metadata: undefined,
          name: 'rule-explicit-return-types-broker.proxy',
          path: '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.proxy.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
        {
          fileType: 'broker',
          hits: [
            {
              line: 1,
              text: "import { ruleExplicitReturnTypesBroker } from './rule-explicit-return-types-broker';",
            },
            {
              line: 3,
              text: "  ruleTester.run('explicit-return-types', ruleExplicitReturnTypesBroker(), {});",
            },
          ],
          metadata: undefined,
          name: 'rule-explicit-return-types-broker.test',
          path: '/project/src/brokers/rule/explicit-return-types/rule-explicit-return-types-broker.test.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });

    it('EMPTY: {grep matches nothing} => implementation file NOT re-included', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const implPath = '/project/src/brokers/lonely-broker.ts';
      const testPath = '/project/src/brokers/lonely-broker.test.ts';

      const implContents = `export const lonelyBroker = (): boolean => true;`;
      const testContents = `export const lonelyBrokerTest = () => {};`;

      const { grep } = DiscoverInputStub({ grep: 'nonexistent' });

      proxy.setupFiles({
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
        ],
        pattern,
      });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([]);
    });

    it('VALID: {grep: "ERROR", context: 1} => returns hits with context lines', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/adapters/fs-access-adapter.ts';
      const pattern = '**/*';
      const contents = `line1
line2
ERROR here
line4
line5`;
      const { grep, context } = DiscoverInputStub({ grep: 'ERROR', context: 1 });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep!, context: context! });

      expect(results).toStrictEqual([
        {
          fileType: 'adapter',
          hits: [
            { line: 2, text: 'line2' },
            { line: 3, text: 'ERROR here' },
            { line: 4, text: 'line4' },
          ],
          metadata: undefined,
          name: 'fs-access-adapter',
          path: '/project/src/adapters/fs-access-adapter.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });
  });

  describe('multi-dot files as regular results', () => {
    it('VALID: test and proxy files => appear as standalone results with companion linking', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const implPath = '/project/src/brokers/user-broker.ts';
      const testPath = '/project/src/brokers/user-broker.test.ts';
      const proxyPath = '/project/src/brokers/user-broker.proxy.ts';

      const implContents = `/**
 * PURPOSE: Manages user operations
 * USAGE: userBroker({ userId })
 */
export const userBroker = ({ userId }: { userId: string }): boolean => true;`;

      const testContents = `export const userBrokerTest = () => { it('works', () => {}); };`;

      const proxyContents = `export const userBrokerProxy = () => ({ mock: jest.fn() });`;

      proxy.setupFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
      });

      const results = await fileScannerBroker({});

      const implResult = results.filter((r) => r.path === '/project/src/brokers/user-broker.ts');

      expect(implResult).toStrictEqual([
        {
          fileType: 'broker',
          metadata: {},
          name: 'user-broker',
          path: '/project/src/brokers/user-broker.ts',
          purpose: 'Manages user operations',
          relatedFiles: ['user-broker.proxy.ts', 'user-broker.test.ts'],
          signature: {
            parameters: [
              {
                name: 'destructured object',
                type: { userId: 'string' },
              },
            ],
            raw: 'export const userBroker = ({ userId }: { userId: string }): boolean =>',
            returnType: 'boolean',
          },
          usage: 'userBroker({ userId })',
        },
      ]);
    });
  });

  describe('relatedFiles enrichment', () => {
    it('VALID: implementation with multiple multi-dot companions => all appear in relatedFiles sorted', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const implPath = '/project/src/brokers/data-broker.ts';
      const testPath = '/project/src/brokers/data-broker.test.ts';
      const proxyPath = '/project/src/brokers/data-broker.proxy.ts';
      const stubPath = '/project/src/brokers/data-broker.stub.ts';

      const implContents = `export const dataBroker = (): boolean => true;`;
      const testContents = `export const dataBrokerTest = () => {};`;
      const proxyContents = `export const dataBrokerProxy = () => {};`;
      const stubContents = `export const dataBrokerStub = () => {};`;

      proxy.setupFiles({
        pattern,
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
          { filepath: stubPath, contents: stubContents },
        ],
      });

      const results = await fileScannerBroker({});

      const implResult = results.filter((r) => r.path === '/project/src/brokers/data-broker.ts');

      expect(implResult).toStrictEqual([
        {
          fileType: 'broker',
          metadata: undefined,
          name: 'data-broker',
          path: '/project/src/brokers/data-broker.ts',
          purpose: undefined,
          relatedFiles: ['data-broker.proxy.ts', 'data-broker.stub.ts', 'data-broker.test.ts'],
          signature: {
            parameters: [],
            raw: 'export const dataBroker = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });

    it('VALID: implementation with no related files => relatedFiles is empty', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';
      const filepath = '/project/src/guards/orphan-guard.ts';
      const contents = `/**
 * PURPOSE: Orphaned guard
 * USAGE: orphanGuard()
 */
export const orphanGuard = (): boolean => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: {},
          name: 'orphan-guard',
          path: '/project/src/guards/orphan-guard.ts',
          purpose: 'Orphaned guard',
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const orphanGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: 'orphanGuard()',
        },
      ]);
    });
  });

  describe('empty results', () => {
    it('EMPTY: no files matched => returns empty array', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      proxy.setupFiles({ files: [], pattern });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
    });
  });

  describe('sorting', () => {
    it('VALID: multiple files => sorted alphabetically by name', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const fileZ = '/project/src/guards/zebra-guard.ts';
      const fileA = '/project/src/guards/alpha-guard.ts';
      const fileM = '/project/src/guards/middle-guard.ts';

      const contentsZ = `export const zebraGuard = (): boolean => true;`;
      const contentsA = `export const alphaGuard = (): boolean => true;`;
      const contentsM = `export const middleGuard = (): boolean => true;`;

      proxy.setupFiles({
        files: [
          { filepath: fileZ, contents: contentsZ },
          { filepath: fileA, contents: contentsA },
          { filepath: fileM, contents: contentsM },
        ],
        pattern,
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'alpha-guard',
          path: '/project/src/guards/alpha-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const alphaGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'middle-guard',
          path: '/project/src/guards/middle-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const middleGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'zebra-guard',
          path: '/project/src/guards/zebra-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const zebraGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });
  });

  describe('resilience to file read failures', () => {
    it('VALID: {one unreadable file, one readable} => readable file still returned', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const goodPath = '/project/src/guards/good-guard.ts';
      const badPath = '/project/src/guards/bad-guard.ts';

      const goodContents = `export const goodGuard = (): boolean => true;`;

      proxy.setupFilesWithFailingReads({
        files: [
          { filepath: goodPath, contents: goodContents },
          {
            filepath: badPath,
            error: FsErrorStub({ code: 'EACCES', path: badPath, syscall: 'open' }),
          },
        ],
        pattern,
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'good-guard',
          path: '/project/src/guards/good-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const goodGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });

    it('VALID: {all files unreadable} => returns empty array without throwing', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const path1 = '/project/src/guards/one-guard.ts';
      const path2 = '/project/src/guards/two-guard.ts';

      proxy.setupFilesWithFailingReads({
        files: [
          { filepath: path1, error: FsErrorStub({ code: 'ENOENT', path: path1, syscall: 'open' }) },
          { filepath: path2, error: FsErrorStub({ code: 'EISDIR', path: path2, syscall: 'open' }) },
        ],
        pattern,
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([]);
    });
  });

  describe('scan dedup', () => {
    it('VALID: {same file appears from two glob paths} => returned once only', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      const samePath = '/project/src/guards/unique-guard.ts';
      const contents = `export const uniqueGuard = (): boolean => true;`;

      // Two entries for the same file — simulates cwd scan and shared scan overlap.
      proxy.setupFiles({
        files: [
          { filepath: samePath, contents },
          { filepath: samePath, contents },
        ],
        pattern,
      });

      const results = await fileScannerBroker({});

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          metadata: undefined,
          name: 'unique-guard',
          path: '/project/src/guards/unique-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const uniqueGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });
  });

  describe('glob + grep combined', () => {
    it('VALID: {glob, grep} => glob filters files, grep filters contents', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*.ts';
      const matchingFile = '/project/src/guards/permission-guard.ts';
      const nonMatchingFile = '/project/src/guards/other-guard.ts';

      const matchingContents = `export const permissionGuard = (): boolean => checkPermission();`;
      const nonMatchingContents = `export const otherGuard = (): boolean => true;`;

      const { glob, grep } = DiscoverInputStub({ glob: '**/*.ts', grep: 'checkPermission' });

      proxy.setupFiles({
        files: [
          { filepath: matchingFile, contents: matchingContents },
          { filepath: nonMatchingFile, contents: nonMatchingContents },
        ],
        pattern,
      });

      const results = await fileScannerBroker({ glob: glob!, grep: grep! });

      expect(results).toStrictEqual([
        {
          fileType: 'guard',
          hits: [
            { line: 1, text: 'export const permissionGuard = (): boolean => checkPermission();' },
          ],
          metadata: undefined,
          name: 'permission-guard',
          path: '/project/src/guards/permission-guard.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: {
            parameters: [],
            raw: 'export const permissionGuard = (): boolean =>',
            returnType: 'boolean',
          },
          usage: undefined,
        },
      ]);
    });
  });

  describe('strict propagation', () => {
    it('VALID: {grep PascalCase, no strict} => cross-convention matches kebab content', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/contracts/orchestration-event-type-contract.ts';
      const pattern = '**/*';
      const contents = `export const orchestrationEventTypeContract = z.enum(['x', 'y']);`;
      const { grep } = DiscoverInputStub({ grep: 'OrchestrationEventType' });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep! });

      expect(results).toStrictEqual([
        {
          fileType: 'contract',
          hits: [
            {
              line: 1,
              text: "export const orchestrationEventTypeContract = z.enum(['x', 'y']);",
            },
          ],
          metadata: undefined,
          name: 'orchestration-event-type-contract',
          path: '/project/src/contracts/orchestration-event-type-contract.ts',
          purpose: undefined,
          relatedFiles: [],
          signature: undefined,
          usage: undefined,
        },
      ]);
    });

    it('VALID: {grep PascalCase, strict: true} => no match against kebab content', async () => {
      const proxy = fileScannerBrokerProxy();
      const filepath = '/project/src/contracts/orchestration-event-type-contract.ts';
      const pattern = '**/*';
      const contents = `export const orchestrationEventTypeContract = z.enum(['x', 'y']);`;
      const { grep, strict } = DiscoverInputStub({
        grep: 'OrchestrationEventType',
        strict: true,
      });

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ grep: grep!, strict: strict! });

      expect(results).toStrictEqual([]);
    });
  });

  describe('ignore patterns', () => {
    // The gateway's globProxy stages an EXACT options object per call, ignore list included, with
    // no zero-arg catch-all — so a mismatched ignore list makes the real call fall through
    // unaddressed and throw, rather than let a test read the args back afterwards. These three
    // tests prove the broker computed the right ignore list by staging the sentinel file ONLY
    // under the exact, filtered address the broker's own computation must produce: the broker
    // rejects (never returning the sentinel) unless it truly sent that ignore list to glob.
    it('VALID: {ignorePatterns} => hands that list to glob in place of the static rules', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';
      const ignorePatterns = ['**/node_modules/**', '**/tmp/**', '**/worktrees/**'];
      const filepath = '/project/src/guards/sentinel-guard.ts';
      const contents = `export const sentinelGuard = (): boolean => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern, ignorePatterns });

      const results = await fileScannerBroker({ ignorePatterns });

      expect(results.map((r) => r.path)).toStrictEqual(['/project/src/guards/sentinel-guard.ts']);
    });

    it('VALID: {glob naming an ignored dir} => drops that rule before glob sees it', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = 'tmp/**/*';
      const { glob } = DiscoverInputStub({ glob: 'tmp' });
      const ignorePatterns = ['**/node_modules/**', '**/tmp/**'];
      const filepath = '/project/tmp/src/guards/sentinel-guard.ts';
      const contents = `export const sentinelGuard = (): boolean => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern, ignorePatterns });

      const results = await fileScannerBroker({ glob: glob!, ignorePatterns });

      expect(results.map((r) => r.path)).toStrictEqual([
        '/project/tmp/src/guards/sentinel-guard.ts',
      ]);
    });

    it('EMPTY: {no ignorePatterns} => falls back to the static rules', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';
      const filepath = '/project/src/guards/sentinel-guard.ts';
      const contents = `export const sentinelGuard = (): boolean => true;`;

      proxy.setupFiles({ files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({});

      expect(results.map((r) => r.path)).toStrictEqual(['/project/src/guards/sentinel-guard.ts']);
    });
  });

  describe('glob failure', () => {
    it('ERROR: {glob rejects} => broker rejects with the gateway wrapper error naming the pattern', async () => {
      const proxy = fileScannerBrokerProxy();
      const pattern = '**/*';

      proxy.setupGlobFailure({
        pattern,
        error: FsErrorStub({ code: 'EACCES', path: '/default/cwd', syscall: 'scandir' }),
      });

      await expect(fileScannerBroker({})).rejects.toThrow(
        /^glob failed for pattern "\/default\/cwd\/\*\*\/\*": EACCES: scandir '\/default\/cwd'$/u,
      );
    });
  });

  describe('rootPath override', () => {
    it('VALID: {rootPath: a path OTHER than cwd()} => scans from rootPath, not the server cwd', async () => {
      const proxy = fileScannerBrokerProxy();
      const rootPath = '/repo/worktrees/siegelense';
      const filepath = '/repo/worktrees/siegelense/src/guards/is-worktree-guard.ts';
      const pattern = '**/*';
      const contents = 'export const isWorktreeGuard = (): boolean => true;';

      proxy.setupFilesAtRoot({ rootPath, files: [{ filepath, contents }], pattern });

      const results = await fileScannerBroker({ rootPath });

      expect(results.map((r) => r.path)).toStrictEqual(['src/guards/is-worktree-guard.ts']);
    });
  });
});

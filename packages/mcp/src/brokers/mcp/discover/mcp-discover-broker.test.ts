import { mcpDiscoverBroker } from './mcp-discover-broker';
import { mcpDiscoverBrokerProxy } from './mcp-discover-broker.proxy';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';

const DEFAULT_ROOT = '/default/cwd';

describe('mcpDiscoverBroker', () => {
  describe('input validation', () => {
    it('ERROR: invalid context type => throws parse error', async () => {
      mcpDiscoverBrokerProxy();

      const input = DiscoverInputStub();

      // Force invalid context value (negative) to trigger zod parse failure
      await expect(
        mcpDiscoverBroker({ input: { ...input, context: -1 as never }, rootPath: DEFAULT_ROOT }),
      ).rejects.toThrow('expected number to be >=0');
    });
  });

  describe('tree format (default)', () => {
    it('EMPTY: {} => returns empty tree and count 0', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      // No glob at all, so globResolveTransformer's own default suffix (`**/*`) is what the
      // scan really asks for.
      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [],
        pattern: '**/*',
      });

      const input = DiscoverInputStub();
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });

    it('VALID: {glob: "**/*.ts"} => returns tree format with matched files', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/guards/standalone-guard.ts';
      const contents =
        '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};';
      const pattern = '**/*.ts';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ glob: '**/*.ts' });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "ENOENT"} => returns tree format with grep hits rendered', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/adapters/fs-access-adapter.ts';
      const contents =
        "/**\n * PURPOSE: Checks file access\n */\nexport const fsAccessAdapter = () => {};\nif (error.code === 'ENOENT') {\n  throw error;\n}";
      const pattern = '**/*';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'ENOENT' });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      // Tree output should contain the file and its grep hit on line 5
      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+:5\s+if \(error\.code === 'ENOENT'\) \{$/mu),
        count: 1,
      });
    });

    it('VALID: {glob: "**/*.ts", grep: "guard"} => passes both glob and grep to scanner', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/guards/standalone-guard.ts';
      const contents =
        '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};';
      const pattern = '**/*.ts';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ glob: '**/*.ts', grep: 'guard' });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "guard", context: 2} => passes context to scanner', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/guards/standalone-guard.ts';
      const contents =
        '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};';
      const pattern = '**/*';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'guard', context: 2 });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "NOMATCH"} => returns empty tree when no files match', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/guards/standalone-guard.ts';
      const contents =
        '/**\n * PURPOSE: standalone guard\n */\nexport const standaloneGuard = () => {};';
      const pattern = '**/*';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'NOMATCH' });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });
  });

  describe('verbose format', () => {
    it('VALID: {verbose: true} => returns full DiscoverResultItem array', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/guards/has-permission-guard.ts';
      const contents =
        '/**\n * PURPOSE: Validates permission\n * USAGE: hasPermissionGuard({ user })\n */\nexport const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;';
      const pattern = '**/*';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ verbose: true });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          {
            name: 'has-permission-guard',
            path: 'src/guards/has-permission-guard.ts',
            type: 'guard',
            purpose: 'Validates permission',
            usage: 'hasPermissionGuard({ user })',
            signature: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
            relatedFiles: [],
          },
        ],
        count: 1,
      });
    });

    it('VALID: {grep: "ENOENT", verbose: true} => returns full items with hits', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/adapters/fs-access-adapter.ts';
      const contents =
        "/**\n * PURPOSE: Checks file access\n *\n * USAGE:\n * fsAccessAdapter({ filepath })\n */\nexport const fsAccessAdapter = () => {};\nif (error.code === 'ENOENT') {\n  throw error;\n}";
      const pattern = '**/*';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'ENOENT', verbose: true });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          {
            name: 'fs-access-adapter',
            path: 'src/adapters/fs-access-adapter.ts',
            type: 'adapter',
            purpose: 'Checks file access',
            usage: 'fsAccessAdapter({ filepath })',
            signature: undefined,
            relatedFiles: [],
            hits: [{ line: 8, text: "if (error.code === 'ENOENT') {" }],
          },
        ],
        count: 1,
      });
    });

    it('EMPTY: {verbose: true} with no files => returns empty array and count 0', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      // No glob at all, so globResolveTransformer's own default suffix (`**/*`) is what the
      // scan really asks for.
      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [],
        pattern: '**/*',
      });

      const input = DiscoverInputStub({ verbose: true });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [],
        count: 0,
      });
    });
  });

  describe('empty-result directory hint', () => {
    it('VALID: {glob matches directories only} => returns hint with directory suggestions', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      // Simulate a glob like `packages/eslint-plugin/src/brokers/rule/explicit-return-types*`
      // that matches a directory but no files (classic nodir:true miss). Already wildcarded, so
      // globResolveTransformer leaves it unchanged — this IS the real suffix the scan uses.
      const pattern = 'packages/eslint-plugin/src/brokers/rule/explicit-return-types*';
      const directoryPath =
        '/default/cwd/packages/eslint-plugin/src/brokers/rule/explicit-return-types';

      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [directoryPath],
        pattern,
      });

      const input = DiscoverInputStub({
        glob: 'packages/eslint-plugin/src/brokers/rule/explicit-return-types*',
      });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          '(no files matched)',
          '',
          'Hint: your glob matched these directories but discover returns files only.',
          'Try appending "/**" to descend into them:',
          '  eslint-plugin/brokers/rule/explicit-return-types/',
        ].join('\n'),
        count: 0,
      });
    });

    it('VALID: {glob matches nothing at all} => returns empty tree without hint', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      // No extension, no wildcard: globResolveTransformer treats this as directory-like and
      // appends `/**/*` — this IS the real suffix the scan uses.
      const pattern = 'totally-fake-folder/**/*';

      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [],
        pattern,
      });

      const input = DiscoverInputStub({ glob: 'totally-fake-folder' });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });

    it('VALID: {glob matches files, grep filters all out} => returns grep-specific hint, not directory hint', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      // Already wildcarded, so globResolveTransformer leaves it unchanged — this IS the real
      // suffix the scan uses.
      const pattern = 'packages/web/src/**';
      const filePath1 = '/default/cwd/packages/web/src/file1.ts';
      const filePath2 = '/default/cwd/packages/web/src/file2.ts';
      const filePath3 = '/default/cwd/packages/web/src/file3.ts';

      brokerProxy.setupGrepFilteredEmpty({
        filePaths: [filePath1, filePath2, filePath3],
        pattern,
      });

      const input = DiscoverInputStub({
        glob: 'packages/web/src/**',
        grep: 'nonexistent-token',
      });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          '(no content matches)',
          '',
          'Your glob matched files, but your grep pattern did not match any content. Glob matched 3 file(s).',
        ].join('\n'),
        count: 0,
      });
    });
  });

  describe('multi-dot files', () => {
    it('VALID: multi-dot files (.test.ts, .proxy.ts) appear as regular results', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      const implPath = '/default/cwd/src/brokers/user-fetch-broker.ts';
      const testPath = '/default/cwd/src/brokers/user-fetch-broker.test.ts';
      const proxyPath = '/default/cwd/src/brokers/user-fetch-broker.proxy.ts';

      const implContents =
        '/**\n * PURPOSE: Fetches user data\n *\n * USAGE:\n * userFetchBroker()\n */\nexport const userFetchBroker = () => {};';
      const testContents =
        '/**\n * PURPOSE: Test user fetch broker\n *\n * USAGE:\n * testUserFetchBroker()\n */\nexport const testUserFetchBroker = () => {};';
      const proxyContents =
        '/**\n * PURPOSE: Proxy for user fetch broker\n *\n * USAGE:\n * userFetchBrokerProxy()\n */\nexport const userFetchBrokerProxy = () => {};';

      const pattern = '**/*';

      brokerProxy.setupMultipleFileDiscovery({
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
        pattern,
      });

      const input = DiscoverInputStub({ verbose: true });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      // All three files should appear (multi-dot files are regular results now)
      expect(result).toStrictEqual({
        results: [
          {
            name: 'user-fetch-broker',
            path: 'src/brokers/user-fetch-broker.ts',
            type: 'broker',
            purpose: 'Fetches user data',
            usage: 'userFetchBroker()',
            signature: undefined,
            relatedFiles: ['user-fetch-broker.proxy.ts', 'user-fetch-broker.test.ts'],
          },
          {
            name: 'user-fetch-broker.proxy',
            path: 'src/brokers/user-fetch-broker.proxy.ts',
            type: 'broker',
            purpose: 'Proxy for user fetch broker',
            usage: 'userFetchBrokerProxy()',
            signature: undefined,
            relatedFiles: [],
          },
          {
            name: 'user-fetch-broker.test',
            path: 'src/brokers/user-fetch-broker.test.ts',
            type: 'broker',
            purpose: 'Test user fetch broker',
            usage: 'testUserFetchBroker()',
            signature: undefined,
            relatedFiles: [],
          },
        ],
        count: 3,
      });
    });
  });

  describe('strict propagation', () => {
    it('VALID: {grep PascalCase, no strict} => cross-convention matches kebab content via tree output', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath =
        '/default/cwd/packages/mcp/src/contracts/orchestration-event-type-contract.ts';
      const contents = `export const orchestrationEventTypeContract = z.enum(['x', 'y']);`;
      const pattern = '**/*.ts';

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({
        glob: '**/*.ts',
        grep: 'OrchestrationEventType',
      });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          'mcp/',
          '  contracts/',
          '    orchestration-event-type-contract (contract)',
          "      :1  export const orchestrationEventTypeContract = z.enum(['x', 'y']);",
        ].join('\n'),
        count: 1,
      });
    });

    it('VALID: {grep PascalCase, strict: true} => no match against kebab content, returns grep-empty hint', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = '/default/cwd/src/contracts/orchestration-event-type-contract.ts';
      // Already wildcarded, so globResolveTransformer leaves it unchanged — this IS the real
      // suffix the scan uses.
      const pattern = '**/*.ts';

      brokerProxy.setupGrepFilteredEmpty({ filePaths: [filepath], pattern });

      const input = DiscoverInputStub({
        glob: '**/*.ts',
        grep: 'OrchestrationEventType',
        strict: true,
      });
      const result = await mcpDiscoverBroker({ input, rootPath: DEFAULT_ROOT });

      expect(result).toStrictEqual({
        results: [
          '(no content matches)',
          '',
          'Your glob matched files, but your grep pattern did not match any content. Glob matched 1 file(s).',
        ].join('\n'),
        count: 0,
      });
    });
  });

  describe('rootPath override', () => {
    it('VALID: {rootPath: a worktree path} => scans from rootPath, not the server cwd', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const rootPath = '/repo/worktrees/siegelense';
      const filepath = '/repo/worktrees/siegelense/src/brokers/step/step-run-broker.ts';
      const pattern = 'packages/siegelense/src/brokers/step/**';
      const contents = 'export const stepRunBroker = () => true;';

      brokerProxy.setupFileDiscoveryAtRoot({ rootPath, filepath, contents, pattern });

      const result = await mcpDiscoverBroker({
        input: DiscoverInputStub({ glob: 'packages/siegelense/src/brokers/step/**' }),
        rootPath,
      });

      expect(result.count).toBe(1);
    });
  });
});

import { mcpDiscoverBroker } from './mcp-discover-broker';
import { mcpDiscoverBrokerProxy } from './mcp-discover-broker.proxy';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';

describe('mcpDiscoverBroker', () => {
  describe('input validation', () => {
    it('ERROR: invalid context type => throws parse error', async () => {
      mcpDiscoverBrokerProxy();

      const input = DiscoverInputStub();

      // Force invalid context value (negative) to trigger zod parse failure
      await expect(
        mcpDiscoverBroker({ input: { ...input, context: -1 as never } }),
      ).rejects.toThrow('Number must be greater than or equal to 0');
    });
  });

  describe('tree format (default)', () => {
    it('EMPTY: {} => returns empty tree and count 0', async () => {
      mcpDiscoverBrokerProxy();

      const input = DiscoverInputStub();
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });

    it('VALID: {glob: "**/*.ts"} => returns tree format with matched files', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/src/guards/standalone-guard.ts` });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*.ts` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ glob: '**/*.ts' as never });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "ENOENT"} => returns tree format with grep hits rendered', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: `${process.cwd()}/src/adapters/fs-access-adapter.ts`,
      });
      const contents = FileContentsStub({
        value:
          "/**\n * PURPOSE: Checks file access\n */\nexport const fsAccessAdapter = () => {};\nif (error.code === 'ENOENT') {\n  throw error;\n}",
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'ENOENT' as never });
      const result = await mcpDiscoverBroker({ input });

      // Tree output should contain the file and its grep hit on line 5
      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+:5\s+if \(error\.code === 'ENOENT'\) \{$/mu),
        count: 1,
      });
    });

    it('VALID: {glob: "**/*.ts", grep: "guard"} => passes both glob and grep to scanner', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/src/guards/standalone-guard.ts` });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*.ts` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ glob: '**/*.ts' as never, grep: 'guard' as never });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "guard", context: 2} => passes context to scanner', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/src/guards/standalone-guard.ts` });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const standaloneGuard = () => {};',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'guard' as never, context: 2 as never });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: expect.stringMatching(/^\s+standalone-guard \(guard\) - standalone guard$/mu),
        count: 1,
      });
    });

    it('VALID: {grep: "NOMATCH"} => returns empty tree when no files match', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/src/guards/standalone-guard.ts` });
      const contents = FileContentsStub({
        value: '/**\n * PURPOSE: standalone guard\n */\nexport const standaloneGuard = () => {};',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'NOMATCH' as never });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });
  });

  describe('verbose format', () => {
    it('VALID: {verbose: true} => returns full DiscoverResultItem array', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: `${process.cwd()}/src/guards/has-permission-guard.ts`,
      });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Validates permission\n * USAGE: hasPermissionGuard({ user })\n */\nexport const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ verbose: true as never });
      const result = await mcpDiscoverBroker({ input });

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
      const filepath = FilePathStub({
        value: `${process.cwd()}/src/adapters/fs-access-adapter.ts`,
      });
      const contents = FileContentsStub({
        value:
          "/**\n * PURPOSE: Checks file access\n *\n * USAGE:\n * fsAccessAdapter({ filepath })\n */\nexport const fsAccessAdapter = () => {};\nif (error.code === 'ENOENT') {\n  throw error;\n}",
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ grep: 'ENOENT' as never, verbose: true as never });
      const result = await mcpDiscoverBroker({ input });

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
      mcpDiscoverBrokerProxy();

      const input = DiscoverInputStub({ verbose: true as never });
      const result = await mcpDiscoverBroker({ input });

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
      // that matches a directory but no files (classic nodir:true miss).
      const pattern = GlobPatternStub({
        value: `${process.cwd()}/packages/eslint-plugin/src/brokers/rule/explicit-return-types*/**/*`,
      });
      const directoryPath = FilePathStub({
        value: `${process.cwd()}/packages/eslint-plugin/src/brokers/rule/explicit-return-types`,
      });

      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [directoryPath],
        pattern,
      });

      const input = DiscoverInputStub({
        glob: 'packages/eslint-plugin/src/brokers/rule/explicit-return-types*' as never,
      });
      const result = await mcpDiscoverBroker({ input });

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

      const pattern = GlobPatternStub({
        value: `${process.cwd()}/totally-fake-folder/**/*`,
      });

      brokerProxy.setupEmptyWithDirectoryHits({
        directoryPaths: [],
        pattern,
      });

      const input = DiscoverInputStub({ glob: 'totally-fake-folder' as never });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: '',
        count: 0,
      });
    });
  });

  describe('multi-dot files', () => {
    it('VALID: multi-dot files (.test.ts, .proxy.ts) appear as regular results', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      const implPath = FilePathStub({ value: `${process.cwd()}/src/brokers/user-fetch-broker.ts` });
      const testPath = FilePathStub({
        value: `${process.cwd()}/src/brokers/user-fetch-broker.test.ts`,
      });
      const proxyPath = FilePathStub({
        value: `${process.cwd()}/src/brokers/user-fetch-broker.proxy.ts`,
      });

      const implContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Fetches user data\n *\n * USAGE:\n * userFetchBroker()\n */\nexport const userFetchBroker = () => {};',
      });
      const testContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Test user fetch broker\n *\n * USAGE:\n * testUserFetchBroker()\n */\nexport const testUserFetchBroker = () => {};',
      });
      const proxyContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Proxy for user fetch broker\n *\n * USAGE:\n * userFetchBrokerProxy()\n */\nexport const userFetchBrokerProxy = () => {};',
      });

      const pattern = GlobPatternStub({ value: `${process.cwd()}/**/*` });

      brokerProxy.setupMultipleFileDiscovery({
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
        pattern,
      });

      const input = DiscoverInputStub({ verbose: true as never });
      const result = await mcpDiscoverBroker({ input });

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
});

import { mcpDiscoverBroker } from './mcp-discover-broker';
import { mcpDiscoverBrokerProxy } from './mcp-discover-broker.proxy';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';
import { FileTypeStub } from '../../../contracts/file-type/file-type.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';

describe('mcpDiscoverBroker', () => {
  describe('type: files', () => {
    it('VALID: {type: "files", fileType: "broker"} => returns tree format and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/broker.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test broker */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({
        type: 'files',
        fileType: FileTypeStub({ value: 'broker' }),
      });
      const result = await mcpDiscoverBroker({ input });

      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(0);
    });

    it('VALID: {type: "files"} => returns tree format and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files' });
      const result = await mcpDiscoverBroker({ input });

      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(1);
    });

    it('VALID: {type: "files", path: "/test"} => returns tree format from path and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const path = FilePathStub({ value: `${process.cwd()}/test` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: `${process.cwd()}/test/**/*.ts` });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', path });
      const result = await mcpDiscoverBroker({ input });

      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(1);
    });

    it('VALID: {type: "files", search: "test"} => returns tree format with matching files and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', search: 'test' });
      const result = await mcpDiscoverBroker({ input });

      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(0);
    });

    it('VALID: {type: "files", name: "guard"} => returns specific file and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', name: 'guard' });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: [
          {
            name: 'guard',
            path: 'test/guard.ts',
            type: 'unknown',
            purpose: undefined,
            signature: undefined,
            usage: undefined,
            relatedFiles: [],
          },
        ],
        count: 1,
      });
    });

    it('VALID: excludes multi-dot files (.test.ts, .proxy.ts) from tree but includes metadata', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();

      // Set up implementation file + related multi-dot files
      const implPath = FilePathStub({ value: `${process.cwd()}/test/user-fetch-broker.ts` });
      const testPath = FilePathStub({ value: `${process.cwd()}/test/user-fetch-broker.test.ts` });
      const proxyPath = FilePathStub({ value: `${process.cwd()}/test/user-fetch-broker.proxy.ts` });

      const implContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Fetches user data\n *\n * USAGE:\n * example\n */\nexport const userFetchBroker = () => {};',
      });
      const testContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Test user fetch broker\n */\nexport const testUserFetchBroker = () => describe("userFetchBroker", () => {});',
      });
      const proxyContents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Proxy for user fetch broker\n */\nexport const userFetchBrokerProxy = () => {};',
      });

      const pattern = GlobPatternStub({ value: '**/*.ts' });

      // Setup all three files together so glob returns them all at once
      brokerProxy.setupMultipleFileDiscovery({
        files: [
          { filepath: implPath, contents: implContents },
          { filepath: testPath, contents: testContents },
          { filepath: proxyPath, contents: proxyContents },
        ],
        pattern,
      });

      const input = DiscoverInputStub({ type: 'files' });
      const result = await mcpDiscoverBroker({ input });

      // Should only show implementation file in tree, not .test.ts or .proxy.ts
      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(1);
    });

    it('VALID: implementation file without related files shows in tree format', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/standalone-guard.ts` });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: standalone guard\n *\n * USAGE:\n * example\n */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files' });
      const result = await mcpDiscoverBroker({ input });

      expect(typeof result.results).toBe('string');
      expect(result.count).toBe(1);
    });
  });

  describe('auto-detect format', () => {
    it('VALID: {name: "guard"} => returns full format (array of DiscoverResultItem)', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: `${process.cwd()}/src/guards/has-permission-guard.ts`,
      });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Validates permission\n * USAGE: hasPermissionGuard({ user })\n */\nexport const hasPermissionGuard = ({ user }: { user?: User }): boolean => true;',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', name: 'has-permission-guard' });
      const result = await mcpDiscoverBroker({ input });

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toStrictEqual({
        name: 'has-permission-guard',
        path: 'src/guards/has-permission-guard.ts',
        type: 'guard',
        purpose: 'Validates permission',
        usage: 'hasPermissionGuard({ user })',
        signature: 'export const hasPermissionGuard = ({ user }: { user?: User }): boolean =>',
        relatedFiles: [],
      });
    });

    it('VALID: {path: "src/guards"} => returns tree format (string)', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const guard1Path = FilePathStub({
        value: `${process.cwd()}/src/guards/has-permission-guard.ts`,
      });
      const guard2Path = FilePathStub({ value: `${process.cwd()}/src/guards/is-admin-guard.ts` });

      const guard1Contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Validates permission\n */\nexport const hasPermissionGuard = () => true;',
      });
      const guard2Contents = FileContentsStub({
        value: '/**\n * PURPOSE: Checks admin role\n */\nexport const isAdminGuard = () => true;',
      });

      const pattern = GlobPatternStub({ value: `${process.cwd()}/src/guards/**/*.ts` });

      brokerProxy.setupMultipleFileDiscovery({
        files: [
          { filepath: guard1Path, contents: guard1Contents },
          { filepath: guard2Path, contents: guard2Contents },
        ],
        pattern,
      });

      const input = DiscoverInputStub({
        type: 'files',
        path: FilePathStub({ value: `${process.cwd()}/src/guards` }),
      });
      const result = await mcpDiscoverBroker({ input });

      const { results } = result;

      expect(typeof results).toBe('string');
      expect(result.count).toBe(2);
      expect(results.toString().includes('has-permission-guard')).toBe(true);
      expect(results.toString().includes('is-admin-guard')).toBe(true);
    });

    it('VALID: {search: "permission"} => returns tree format (string)', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: `${process.cwd()}/src/guards/has-permission-guard.ts`,
      });
      const contents = FileContentsStub({
        value:
          '/**\n * PURPOSE: Validates permission\n */\nexport const hasPermissionGuard = () => true;',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', search: 'permission' });
      const result = await mcpDiscoverBroker({ input });

      const { results } = result;

      expect(typeof results).toBe('string');
      expect(result.count).toBe(1);
      expect(results.toString().includes('has-permission-guard')).toBe(true);
    });
  });

  describe('type: standards', () => {
    it('VALID: {type: "standards", section: "testing-standards/assertions"} => returns standards sections and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/testing-standards.md',
      });
      const contents = FileContentsStub({
        value: `## Assertions

Test assertions content here.

## Other Section

Other content.`,
      });

      brokerProxy.setupStandardsDiscovery({ filepath, contents });

      const input = DiscoverInputStub({
        type: 'standards',
        section: 'testing-standards/assertions',
      });
      const result = await mcpDiscoverBroker({ input });

      expect(result.count).toBe(1);
      expect(result.results).toHaveLength(1);
    });

    it('VALID: {type: "standards"} => returns all sections and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/project-standards.md',
      });
      const contents = FileContentsStub({
        value: `## Section 1

Content 1.

## Section 2

Content 2.

## Section 3

Content 3.`,
      });

      brokerProxy.setupStandardsDiscovery({ filepath, contents });

      const input = DiscoverInputStub({ type: 'standards' });
      const result = await mcpDiscoverBroker({ input });

      expect(result.count).toBe(3);
      expect(result.results).toHaveLength(3);
    });
  });
});

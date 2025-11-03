import { mcpDiscoverBroker } from './mcp-discover-broker';
import { mcpDiscoverBrokerProxy } from './mcp-discover-broker.proxy';
import { DiscoverInputStub } from '../../../contracts/discover-input/discover-input.stub';
import { FileTypeStub } from '../../../contracts/file-type/file-type.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';

describe('mcpDiscoverBroker', () => {
  describe('type: files', () => {
    it('VALID: {type: "files", fileType: "broker"} => returns file metadata and count', async () => {
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

      expect(result).toStrictEqual({
        results: [],
        count: 0,
      });
    });

    it('VALID: {type: "files"} => returns all files and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files' });
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

    it('VALID: {type: "files", path: "/test"} => returns files from path and count', async () => {
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

    it('VALID: {type: "files", search: "test"} => returns matching files and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: `${process.cwd()}/test/guard.ts` });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', search: 'test' });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: [],
        count: 0,
      });
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

    it('VALID: excludes multi-dot files (.test.ts, .proxy.ts) from results but includes them as relatedFiles', async () => {
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

      // Should only return the implementation file, not .test.ts or .proxy.ts
      expect(result).toStrictEqual({
        results: [
          {
            name: 'user-fetch-broker',
            path: 'test/user-fetch-broker.ts',
            type: 'broker',
            purpose: 'Fetches user data',
            signature: undefined,
            usage: 'example',
            relatedFiles: ['user-fetch-broker.proxy.ts', 'user-fetch-broker.test.ts'],
          },
        ],
        count: 1,
      });
    });

    it('VALID: implementation file without related files has empty relatedFiles array', async () => {
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

      expect(result).toStrictEqual({
        results: [
          {
            name: 'standalone-guard',
            path: 'test/standalone-guard.ts',
            type: 'guard',
            purpose: 'standalone guard',
            signature: undefined,
            usage: 'example',
            relatedFiles: [],
          },
        ],
        count: 1,
      });
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

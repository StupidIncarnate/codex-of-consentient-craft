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
      const filepath = FilePathStub({ value: '/test/broker.ts' });
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
      const filepath = FilePathStub({ value: '/test/guard.ts' });
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
            path: '/test/guard.ts',
            type: 'unknown',
            purpose: undefined,
            signature: undefined,
            usage: undefined,
          },
        ],
        count: 1,
      });
    });

    it('VALID: {type: "files", path: "/test"} => returns files from path and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: '/test/guard.ts' });
      const path = FilePathStub({ value: '/test' });
      const contents = FileContentsStub({
        value: '/** PURPOSE: test guard */\nexport const test = () => {};',
      });
      const pattern = GlobPatternStub({ value: '/test/**/*.ts' });

      brokerProxy.setupFileDiscovery({ filepath, contents, pattern });

      const input = DiscoverInputStub({ type: 'files', path });
      const result = await mcpDiscoverBroker({ input });

      expect(result).toStrictEqual({
        results: [
          {
            name: 'guard',
            path: '/test/guard.ts',
            type: 'unknown',
            purpose: undefined,
            signature: undefined,
            usage: undefined,
          },
        ],
        count: 1,
      });
    });

    it('VALID: {type: "files", search: "test"} => returns matching files and count', async () => {
      const brokerProxy = mcpDiscoverBrokerProxy();
      const filepath = FilePathStub({ value: '/test/guard.ts' });
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
      const filepath = FilePathStub({ value: '/test/guard.ts' });
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
            path: '/test/guard.ts',
            type: 'unknown',
            purpose: undefined,
            signature: undefined,
            usage: undefined,
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

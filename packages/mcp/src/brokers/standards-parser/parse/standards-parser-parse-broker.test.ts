import { standardsParserParseBroker } from './standards-parser-parse-broker';
import { standardsParserParseBrokerProxy } from './standards-parser-parse-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { StandardsSectionStub } from '../../../contracts/standards-section/standards-section.stub';

describe('standardsParserParseBroker', () => {
  describe('with single section', () => {
    it('VALID: {section: "testing-standards/proxy-architecture"} => returns specific section', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/testing-standards.md',
      });
      const contents = FileContentsStub({
        value: `# Testing Standards

## Proxy Architecture

Proxies handle test setup...

## Another Section

More content here...`,
      });

      brokerProxy.setupMarkdownFile({ filepath, contents });

      const result = await standardsParserParseBroker({
        section: 'testing-standards/proxy-architecture',
      });

      expect(result).toStrictEqual([
        StandardsSectionStub({
          section: 'testing-standards/proxy-architecture',
          content: `## Proxy Architecture

Proxies handle test setup...
`,
          path: 'packages/standards/testing-standards.md#proxy-architecture',
        }),
      ]);
    });
  });

  describe('with all sections', () => {
    it('VALID: {} => returns all sections from all markdown files', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/testing-standards.md',
      });
      const contents = FileContentsStub({
        value: `# Testing Standards

## Proxy Architecture

Proxies handle test setup...

## Test Format

Tests should follow...`,
      });

      brokerProxy.setupMarkdownFile({ filepath, contents });

      const result = await standardsParserParseBroker({});

      expect(result).toStrictEqual([
        StandardsSectionStub({
          section: 'testing-standards/proxy-architecture',
          content: `## Proxy Architecture

Proxies handle test setup...
`,
          path: 'packages/standards/testing-standards.md#proxy-architecture',
        }),
        StandardsSectionStub({
          section: 'testing-standards/test-format',
          content: `## Test Format

Tests should follow...`,
          path: 'packages/standards/testing-standards.md#test-format',
        }),
      ]);
    });
  });

  describe('with nonexistent section', () => {
    it('EMPTY: {section: "nonexistent"} => returns empty array', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/testing-standards.md',
      });
      const contents = FileContentsStub({
        value: `# Testing Standards

## Proxy Architecture

Proxies handle test setup...`,
      });

      brokerProxy.setupMarkdownFile({ filepath, contents });

      const result = await standardsParserParseBroker({
        section: 'nonexistent/section',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('with multiple files', () => {
    it('VALID: {} => returns sections from all markdown files', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath1 = FilePathStub({
        value: 'packages/standards/testing-standards.md',
      });
      const contents1 = FileContentsStub({
        value: `# Testing Standards

## Proxy Architecture

Proxies handle test setup...`,
      });
      const filepath2 = FilePathStub({
        value: 'packages/standards/project-standards.md',
      });
      const contents2 = FileContentsStub({
        value: `# Project Standards

## File Structure

Files should be organized...`,
      });

      brokerProxy.setupMarkdownFiles({
        files: [
          { filepath: filepath1, contents: contents1 },
          { filepath: filepath2, contents: contents2 },
        ],
      });

      const result = await standardsParserParseBroker({});

      expect(result).toStrictEqual([
        StandardsSectionStub({
          section: 'testing-standards/proxy-architecture',
          content: `## Proxy Architecture

Proxies handle test setup...`,
          path: 'packages/standards/testing-standards.md#proxy-architecture',
        }),
        StandardsSectionStub({
          section: 'project-standards/file-structure',
          content: `## File Structure

Files should be organized...`,
          path: 'packages/standards/project-standards.md#file-structure',
        }),
      ]);
    });
  });

  describe('with empty file', () => {
    it('EMPTY: {contents: ""} => returns empty array', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/empty.md',
      });
      const contents = FileContentsStub({
        value: '',
      });

      brokerProxy.setupMarkdownFile({ filepath, contents });

      const result = await standardsParserParseBroker({});

      expect(result).toStrictEqual([]);
    });
  });

  describe('with file without sections', () => {
    it('EMPTY: {contents: "# Title only"} => returns empty array', async () => {
      const brokerProxy = standardsParserParseBrokerProxy();
      const filepath = FilePathStub({
        value: 'packages/standards/title-only.md',
      });
      const contents = FileContentsStub({
        value: '# Title Only\n\nSome content without sections.',
      });

      brokerProxy.setupMarkdownFile({ filepath, contents });

      const result = await standardsParserParseBroker({});

      expect(result).toStrictEqual([]);
    });
  });
});

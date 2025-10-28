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

      expect(result).toHaveLength(2);
      expect(result[0]?.section).toBe('testing-standards/proxy-architecture');
      expect(result[1]?.section).toBe('testing-standards/test-format');
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
});

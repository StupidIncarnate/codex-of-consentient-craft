import { StandardsSectionStub } from './standards-section.stub';

describe('standardsSectionContract', () => {
  it('VALID: {section, content, path} => parses successfully', () => {
    const result = StandardsSectionStub({
      section: 'testing/assertions',
      content: '## Critical Assertions\n\nAlways use toStrictEqual...',
      path: 'packages/standards/testing-standards.md#assertions',
    });

    expect(result).toStrictEqual({
      section: 'testing/assertions',
      content: '## Critical Assertions\n\nAlways use toStrictEqual...',
      path: 'packages/standards/testing-standards.md#assertions',
    });
  });

  it('VALID: {empty content} => parses successfully', () => {
    const result = StandardsSectionStub({
      section: 'introduction',
      content: '',
      path: 'packages/standards/testing-standards.md#intro',
    });

    expect(result).toStrictEqual({
      section: 'introduction',
      content: '',
      path: 'packages/standards/testing-standards.md#intro',
    });
  });

  it('VALID: {multiline content with special characters} => parses successfully', () => {
    const result = StandardsSectionStub({
      section: 'testing/code-examples',
      content:
        '## Code Examples\n\n```typescript\nconst foo = "bar";\n```\n\n**Note:** Use `toStrictEqual()` for objects.',
      path: 'packages/standards/testing-standards.md#examples',
    });

    expect(result).toStrictEqual({
      section: 'testing/code-examples',
      content:
        '## Code Examples\n\n```typescript\nconst foo = "bar";\n```\n\n**Note:** Use `toStrictEqual()` for objects.',
      path: 'packages/standards/testing-standards.md#examples',
    });
  });

  it('VALID: {nested section path} => parses successfully', () => {
    const result = StandardsSectionStub({
      section: 'proxy-architecture/adapter-proxy/empty-proxy-pattern',
      content: 'Empty proxy pattern explained here...',
      path: 'packages/standards/testing-standards.md#proxy-architecture-adapter-proxy-empty-proxy-pattern',
    });

    expect(result).toStrictEqual({
      section: 'proxy-architecture/adapter-proxy/empty-proxy-pattern',
      content: 'Empty proxy pattern explained here...',
      path: 'packages/standards/testing-standards.md#proxy-architecture-adapter-proxy-empty-proxy-pattern',
    });
  });
});

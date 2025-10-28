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
});

import { HeaderInfoStub } from './header-info.stub';
import { LineIndexStub } from '../line-index/line-index.stub';
import { HeaderTextStub } from '../header-text/header-text.stub';

describe('headerInfoContract', () => {
  it('VALID: {lineIndex: 0, headerText: "## Default Header"} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 0 }),
      headerText: HeaderTextStub({ value: '## Default Header' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 0,
      headerText: '## Default Header',
    });
  });

  it('VALID: {lineIndex: 10, headerText: "# Main Title"} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 10 }),
      headerText: HeaderTextStub({ value: '# Main Title' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 10,
      headerText: '# Main Title',
    });
  });

  it('VALID: {lineIndex: 999, headerText: "### Subsection"} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 999 }),
      headerText: HeaderTextStub({ value: '### Subsection' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 999,
      headerText: '### Subsection',
    });
  });

  it('VALID: {headerText: empty string} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 5 }),
      headerText: HeaderTextStub({ value: '' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 5,
      headerText: '',
    });
  });

  it('VALID: {headerText: very long string} => parses successfully', () => {
    const longText = `# ${'A'.repeat(1000)}`;
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 0 }),
      headerText: HeaderTextStub({ value: longText }),
    });

    expect(result).toStrictEqual({
      lineIndex: 0,
      headerText: longText,
    });
  });

  it('VALID: {headerText: unicode characters} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 15 }),
      headerText: HeaderTextStub({ value: '## 日本語ヘッダー 🎯' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 15,
      headerText: '## 日本語ヘッダー 🎯',
    });
  });

  it('VALID: {headerText: special characters} => parses successfully', () => {
    const result = HeaderInfoStub({
      lineIndex: LineIndexStub({ value: 3 }),
      headerText: HeaderTextStub({ value: '### Header-with_special.chars!@#$%' }),
    });

    expect(result).toStrictEqual({
      lineIndex: 3,
      headerText: '### Header-with_special.chars!@#$%',
    });
  });
});

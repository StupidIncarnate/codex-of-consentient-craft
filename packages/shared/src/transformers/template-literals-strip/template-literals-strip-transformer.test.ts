import { templateLiteralsStripTransformer } from './template-literals-strip-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('templateLiteralsStripTransformer', () => {
  describe('top-level code preservation', () => {
    it('EMPTY: {source: empty string} => returns empty string', () => {
      const source = ContentTextStub({ value: '' });
      const result = templateLiteralsStripTransformer({ source });

      expect(String(result)).toBe('');
    });

    it('VALID: {source: code with no template literals} => returns input unchanged', () => {
      const text = `import { foo } from './foo';\nconst x = 1;`;
      const source = ContentTextStub({ value: text });
      const result = templateLiteralsStripTransformer({ source });

      expect(String(result)).toBe(text);
    });

    it('VALID: {source: single-quoted import path} => preserves quotes and content', () => {
      const text = `import { foo } from './foo';`;
      const source = ContentTextStub({ value: text });
      const result = templateLiteralsStripTransformer({ source });

      expect(String(result)).toBe(text);
    });

    it('VALID: {source: double-quoted import path} => preserves quotes and content', () => {
      const text = `import { foo } from "./foo";`;
      const source = ContentTextStub({ value: text });
      const result = templateLiteralsStripTransformer({ source });

      expect(String(result)).toBe(text);
    });

    it('VALID: {source: string with escaped quote} => preserves the escape sequence', () => {
      const text = `const x = 'don\\'t';`;
      const source = ContentTextStub({ value: text });
      const result = templateLiteralsStripTransformer({ source });

      expect(String(result)).toBe(text);
    });
  });

  describe('line comments', () => {
    it('VALID: {source: line comment with import-shaped text} => strips comment, preserves real import', () => {
      const fakeComment = `// import { fake } from './fake-from-comment';`;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({ value: `${fakeComment}\n${realImport}` });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `${' '.repeat(fakeComment.length)}\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: line comment in middle of file} => preserves trailing newline', () => {
      const lineComment = `// hello`;
      const code = `const x = 1;`;
      const source = ContentTextStub({ value: `${lineComment}\n${code}` });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `${' '.repeat(lineComment.length)}\n${code}`;

      expect(String(result)).toBe(expected);
    });
  });

  describe('template literals', () => {
    it('VALID: {source: simple template with import-shaped body} => strips template body to spaces', () => {
      const templateBody = `import { fake } from "./fake";`;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const md = \`${templateBody}\`;\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const md = ${' '.repeat(templateBody.length + 2)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: multi-line template literal} => preserves newlines, strips body', () => {
      const line2 = `import { fake } from './fake';`;
      const line3 = `second line`;
      const templateBody = `\n${line2}\n${line3}\n`;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const md = \`${templateBody}\`;\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const strippedBody = ` \n${' '.repeat(line2.length)}\n${' '.repeat(line3.length)}\n `;
      const expected = `const md = ${strippedBody};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: template with dollar-brace interpolation} => strips body and interp content', () => {
      const templateExpr = `\`pre \${someFunc('./fake-path')} post\``;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const md = ${templateExpr};\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const md = ${' '.repeat(templateExpr.length)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: nested template inside dollar-brace} => strips both outer and inner templates', () => {
      const nestedExpr = `\`outer \${\`inner with import { x } from "./fake"\`} after\``;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const md = ${nestedExpr};\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const md = ${' '.repeat(nestedExpr.length)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: object literal inside dollar-brace} => brace counter handles nesting', () => {
      const templateExpr = `\`\${ { a: 1 } }\``;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const x = ${templateExpr};\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const x = ${' '.repeat(templateExpr.length)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: string with brace inside dollar-brace} => brace counter ignores braces in strings', () => {
      const templateExpr = `\`\${ obj["key}weird"] }\``;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const x = ${templateExpr};\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const x = ${' '.repeat(templateExpr.length)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });

    it('VALID: {source: escaped backtick inside template} => does not exit template prematurely', () => {
      const templateExpr = `\`before \\\` after\``;
      const realImport = `import { real } from './real';`;
      const source = ContentTextStub({
        value: `const x = ${templateExpr};\n${realImport}`,
      });
      const result = templateLiteralsStripTransformer({ source });
      const expected = `const x = ${' '.repeat(templateExpr.length)};\n${realImport}`;

      expect(String(result)).toBe(expected);
    });
  });
});

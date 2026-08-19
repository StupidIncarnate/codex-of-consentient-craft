import { parseToolResultDisplayTransformer } from './parse-tool-result-display-transformer';

describe('parseToolResultDisplayTransformer', () => {
  describe('JSON replies carrying an escaped document', () => {
    it('VALID: {JSON with a markdown prompt property} => marks that property markdown and the rest text', () => {
      const content = JSON.stringify({
        name: 'codeweaver',
        model: 'sonnet',
        prompt: '# Operator\n\nYou own ONE operation item.',
      });

      expect(parseToolResultDisplayTransformer({ content })).toStrictEqual([
        { kind: 'text', label: 'name', text: 'codeweaver' },
        { kind: 'text', label: 'model', text: 'sonnet' },
        { kind: 'markdown', label: 'prompt', source: '# Operator\n\nYou own ONE operation item.' },
      ]);
    });

    it('VALID: {JSON with a multi-line non-markdown property} => keeps that property as text', () => {
      const content = JSON.stringify({
        exitCode: 1,
        stdout: 'building...\nfailed at step 2\n',
      });

      expect(parseToolResultDisplayTransformer({ content })).toStrictEqual([
        { kind: 'text', label: 'exitCode', text: '1' },
        { kind: 'text', label: 'stdout', text: 'building...\nfailed at step 2\n' },
      ]);
    });

    it('VALID: {JSON with a nested object beside a document} => serialises the nested value to one line', () => {
      const content = JSON.stringify({
        meta: { rounds: 3 },
        report: '## Findings\n\nNone.',
      });

      expect(parseToolResultDisplayTransformer({ content })).toStrictEqual([
        { kind: 'text', label: 'meta', text: '{"rounds":3}' },
        { kind: 'markdown', label: 'report', source: '## Findings\n\nNone.' },
      ]);
    });

    it('VALID: {JSON property holding null} => renders the literal it serialises to', () => {
      const content = JSON.stringify({ error: null, log: 'line one\nline two' });

      expect(parseToolResultDisplayTransformer({ content })).toStrictEqual([
        { kind: 'text', label: 'error', text: 'null' },
        { kind: 'text', label: 'log', text: 'line one\nline two' },
      ]);
    });
  });

  describe('JSON replies that read fine already', () => {
    it('VALID: {JSON of single-line scalars} => declines to restructure', () => {
      const content = JSON.stringify({ results: 'mcp__dungeonmaster__discover', count: 10 });

      expect(parseToolResultDisplayTransformer({ content })).toBe(null);
    });

    it('EMPTY: {JSON object with no properties} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: '{}' })).toBe(null);
    });

    it('VALID: {JSON array} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: '["a","b"]' })).toBe(null);
    });

    it('VALID: {JSON scalar} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: '42' })).toBe(null);
    });

    it('VALID: {JSON null} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: 'null' })).toBe(null);
    });
  });

  describe('plain replies', () => {
    it('VALID: {markdown document} => returns one uncaptioned markdown unit', () => {
      const content = '# Architecture Overview\n\nLLMs squirrel code away.';

      expect(parseToolResultDisplayTransformer({ content })).toStrictEqual([
        { kind: 'markdown', source: '# Architecture Overview\n\nLLMs squirrel code away.' },
      ]);
    });

    it('VALID: {build log} => declines so the log keeps its line structure', () => {
      const content = '> @dungeonmaster/web@1.0.0 build\n> tsc\n\ndone in 4s';

      expect(parseToolResultDisplayTransformer({ content })).toBe(null);
    });

    it('VALID: {one-line answer} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: 'file contents here' })).toBe(null);
    });

    it('EMPTY: {content: ""} => declines to restructure', () => {
      expect(parseToolResultDisplayTransformer({ content: '' })).toBe(null);
    });

    it('VALID: {truncated JSON preview} => declines, because half an object is not an object', () => {
      const content = '{"name":"codeweaver","prompt":"# Operator\\n\\nYou own ONE oper';

      expect(parseToolResultDisplayTransformer({ content })).toBe(null);
    });
  });
});

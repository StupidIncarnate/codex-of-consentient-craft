import { toolRowSummaryTransformer } from './tool-row-summary-transformer';
import { toolRowSummaryTransformerProxy } from './tool-row-summary-transformer.proxy';

describe('toolRowSummaryTransformer', () => {
  describe('single-value tools', () => {
    it('VALID: {toolName: Read, file_path} => returns the bare value with no key prefix', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      expect(result).toBe('/src/index.ts');
    });

    it('VALID: {toolName: Read, deep repo path} => elides the directory spine', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Read',
        toolInput: '{"file_path":"packages/web/src/widgets/tool-row/tool-row-widget.tsx"}',
      });

      expect(result).toBe('web/…/tool-row-widget.tsx');
    });

    it('VALID: {toolName: Edit, camelCase input leading with a flag} => summarises the file, not "false"', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Edit',
        toolInput:
          '{"replaceAll":false,"filePath":"packages/web/src/widgets/comment-popover/comment-popover-widget.proxy.tsx","oldString":"a","newString":"b"}',
      });

      expect(result).toBe('web/…/comment-popover-widget.proxy.tsx');
    });

    it('EDGE: {single-value tool whose only fields are flags} => falls back to the labelled form', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Edit',
        toolInput: '{"replaceAll":false,"dryRun":true}',
      });

      expect(result).toBe('replaceAll: false, dryRun: true');
    });

    it('VALID: {toolName: Bash, command with paths} => shortens every path in the command', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Bash',
        toolInput:
          '{"command":"git diff -- packages/web/src/guards/a/a-guard.ts packages/shared/src/guards/b/b-guard.ts"}',
      });

      expect(result).toBe('git diff -- web/…/a-guard.ts shared/…/b-guard.ts');
    });
  });

  describe('multi-field tools', () => {
    it('VALID: {toolName: Grep, two fields} => joins key/value pairs', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Grep',
        toolInput: '{"pattern":"TODO","path":"/src"}',
      });

      expect(result).toBe('pattern: TODO, path: /src');
    });

    it('VALID: {mcp tool with glob} => keeps the key prefix and shortens the glob', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'mcp__dungeonmaster__discover',
        toolInput: '{"glob":"packages/web/src/widgets/app/**"}',
      });

      expect(result).toBe('glob: web/…/app/**');
    });
  });

  describe('Skill invocations', () => {
    it('VALID: {toolName: Skill, skill and args} => drops the skill name the label already carries', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":"--amend"}',
      });

      expect(result).toBe('args: --amend');
    });

    it('EMPTY: {toolName: Skill, only skill field} => returns empty text', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Skill',
        toolInput: '{"skill":"commit"}',
      });

      expect(result).toBe('');
    });
  });

  describe('unparseable and empty input', () => {
    it('EMPTY: {toolInput: "{}"} => returns empty text', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({ toolName: 'read_file', toolInput: '{}' });

      expect(result).toBe('');
    });

    it('EMPTY: {toolInput: ""} => returns empty text', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({ toolName: 'read_file', toolInput: '' });

      expect(result).toBe('');
    });

    it('EDGE: {toolInput is a JSON array} => falls back to the raw input text', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({ toolName: 'Weird', toolInput: '["a","b"]' });

      expect(result).toBe('["a","b"]');
    });
  });

  describe('truncation', () => {
    it('EDGE: {value longer than the inline budget} => cuts at the budget and appends the suffix', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Bash',
        toolInput: `{"command":"${'x'.repeat(300)}"}`,
      });

      expect(result).toBe(`${'x'.repeat(200)}...`);
    });

    it('EDGE: {value exactly at the inline budget} => left whole', () => {
      toolRowSummaryTransformerProxy();

      const result = toolRowSummaryTransformer({
        toolName: 'Bash',
        toolInput: `{"command":"${'x'.repeat(200)}"}`,
      });

      expect(result).toBe('x'.repeat(200));
    });
  });
});

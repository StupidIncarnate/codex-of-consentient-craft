import { toolDisplayLabelTransformer } from './tool-display-label-transformer';
import { toolDisplayLabelTransformerProxy } from './tool-display-label-transformer.proxy';

describe('toolDisplayLabelTransformer', () => {
  describe('Bash commands', () => {
    it('VALID: {command: "git diff -- src/a.ts"} => returns "git diff"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"git diff -- src/a.ts"}',
      });

      expect(result).toBe('git diff');
    });

    it('VALID: {command: "npm run ward -- --only unit"} => returns three-word command name', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"npm run ward -- --only unit"}',
      });

      expect(result).toBe('npm run ward');
    });

    it('EDGE: {command: "git log --oneline --graph --all -n 5"} => caps at the word budget', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"git log --oneline --graph --all -n 5"}',
      });

      expect(result).toBe('git log');
    });

    it('EDGE: {command: "npm run build --workspace=@dungeonmaster/web"} => caps at three words', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"npm run build --workspace=@dungeonmaster/web"}',
      });

      expect(result).toBe('npm run build');
    });

    it('VALID: {command: "grep -n pattern file"} => stops at the first flag', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"grep -n pattern file"}',
      });

      expect(result).toBe('grep');
    });

    it('VALID: {command: "VERBOSE=1 npm run dev"} => skips the leading env assignment', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"VERBOSE=1 npm run dev"}',
      });

      expect(result).toBe('npm run dev');
    });

    it('VALID: {command: "ls"} => returns the single word', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });

      expect(result).toBe('ls');
    });

    it('EDGE: {command: "./scripts/run.sh"} => falls back to "Bash" for an unnameable command', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"./scripts/run.sh"}',
      });

      expect(result).toBe('Bash');
    });

    it('EMPTY: {command: ""} => falls back to "Bash"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":""}',
      });

      expect(result).toBe('Bash');
    });

    it('EMPTY: {no command field} => falls back to "Bash"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"path":"/test"}',
      });

      expect(result).toBe('Bash');
    });

    it('EMPTY: {toolInput: ""} => falls back to "Bash" when input does not parse', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({ toolName: 'Bash', toolInput: '' });

      expect(result).toBe('Bash');
    });

    it('EDGE: {command: "FOO=1 BAR=2"} => falls back to "Bash" when only env assignments remain', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"FOO=1 BAR=2"}',
      });

      expect(result).toBe('Bash');
    });
  });

  describe('MCP tools', () => {
    it('VALID: {toolName: "mcp__dungeonmaster__discover"} => strips the server prefix', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'mcp__dungeonmaster__discover',
        toolInput: '{"glob":"packages/web/**"}',
      });

      expect(result).toBe('discover');
    });

    it('VALID: {toolName: "mcp__claude-in-chrome__tabs_context_mcp"} => keeps underscores in the tool name', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'mcp__claude-in-chrome__tabs_context_mcp',
        toolInput: '{}',
      });

      expect(result).toBe('tabs_context_mcp');
    });

    it('EDGE: {toolName: "mcp__server__"} => keeps the raw name when stripping empties it', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({ toolName: 'mcp__server__', toolInput: '{}' });

      expect(result).toBe('mcp__server__');
    });
  });

  describe('Skill invocations', () => {
    it('VALID: {toolName: "Skill", skill: "commit"} => returns "Skill: commit"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Skill',
        toolInput: '{"skill":"commit","args":""}',
      });

      expect(result).toBe('Skill: commit');
    });

    it('EMPTY: {toolName: "Skill", no skill field} => returns "Skill: unknown"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({ toolName: 'Skill', toolInput: '{"args":""}' });

      expect(result).toBe('Skill: unknown');
    });

    it('EMPTY: {toolName: "Skill", toolInput: ""} => returns "Skill: unknown"', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({ toolName: 'Skill', toolInput: '' });

      expect(result).toBe('Skill: unknown');
    });
  });

  describe('plain tools', () => {
    it('VALID: {toolName: "Read"} => returns the tool name unchanged', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'Read',
        toolInput: '{"file_path":"/src/index.ts"}',
      });

      expect(result).toBe('Read');
    });

    it('VALID: {toolName: "read_file"} => leaves a non-MCP underscore name alone', () => {
      toolDisplayLabelTransformerProxy();

      const result = toolDisplayLabelTransformer({
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
      });

      expect(result).toBe('read_file');
    });
  });
});

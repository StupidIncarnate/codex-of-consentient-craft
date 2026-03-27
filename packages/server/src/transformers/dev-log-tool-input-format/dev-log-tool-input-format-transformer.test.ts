import { devLogToolInputFormatTransformer } from './dev-log-tool-input-format-transformer';

describe('devLogToolInputFormatTransformer', () => {
  it('VALID: {Read with file_path} => returns shortened path', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'Read',
      input: { file_path: '/home/user/projects/repo/packages/server/src/file.ts' },
    });

    expect(result).toBe('.../server/src/file.ts');
  });

  it('VALID: {Edit with file_path} => returns shortened path', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'Edit',
      input: { file_path: '/a/b/c.ts' },
    });

    expect(result).toBe('.../a/b/c.ts');
  });

  it('VALID: {Bash with command} => returns quoted command', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'Bash',
      input: { command: 'npm run ward' },
    });

    expect(result).toBe('"npm run ward"');
  });

  it('VALID: {Grep with pattern} => returns pattern label', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'Grep',
      input: { pattern: 'slotIndex' },
    });

    expect(result).toBe('pattern:"slotIndex"');
  });

  it('VALID: {Agent with description} => returns quoted description', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'Agent',
      input: { description: 'Find server code' },
    });

    expect(result).toBe('"Find server code"');
  });

  it('VALID: {TaskUpdate} => returns task ID and status', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'TaskUpdate',
      input: { taskId: '1', status: 'completed' },
    });

    expect(result).toBe('task:1  completed');
  });

  it('VALID: {MCP tool with questId} => returns short quest ID', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'mcp__dungeonmaster__modify-quest',
      input: { questId: 'abc12345-dead-beef-cafe-123456789012' },
    });

    expect(result).toBe('quest:abc12345');
  });

  it('EDGE: {unknown tool} => returns empty', () => {
    const result = devLogToolInputFormatTransformer({
      toolName: 'SomeUnknownTool',
      input: { foo: 'bar' },
    });

    expect(result).toBe('');
  });
});

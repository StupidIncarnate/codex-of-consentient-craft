import { folderDetailHookDataContract } from './folder-detail-hook-data-contract';
import { FolderDetailHookDataStub } from './folder-detail-hook-data.stub';

describe('folderDetailHookDataContract', () => {
  it('VALID: {full Write payload with agent_id} => parses and keeps every field', () => {
    const result = FolderDetailHookDataStub({ agent_id: 'agent-123' });

    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
      agent_id: 'agent-123',
    });
  });

  it('VALID: {same payload without agent_id} => parses and agent_id is undefined', () => {
    const result = FolderDetailHookDataStub();

    expect(result.agent_id).toBe(undefined);
    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
    });
  });

  it('VALID: {unknown top-level keys session_id and cwd} => survive via passthrough', () => {
    const result = folderDetailHookDataContract.parse({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cwd: '/tmp/stub-cwd',
    });

    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      cwd: '/tmp/stub-cwd',
    });
  });

  it('VALID: {unknown key content inside tool_input} => survives via passthrough', () => {
    const result = folderDetailHookDataContract.parse({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts', content: 'hello' },
      transcript_path: '/tmp/transcript.jsonl',
    });

    expect(result).toStrictEqual({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts', content: 'hello' },
      transcript_path: '/tmp/transcript.jsonl',
    });
  });

  it('INVALID: {hook_event_name: "PostToolUse"} => fails', () => {
    const result = folderDetailHookDataContract.safeParse({
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
    });

    expect(result.success).toBe(false);
  });

  it('INVALID: {tool_input missing file_path} => fails', () => {
    const result = folderDetailHookDataContract.safeParse({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: {},
      transcript_path: '/tmp/transcript.jsonl',
    });

    expect(result.success).toBe(false);
  });

  it('INVALID: {tool_name: ""} => fails', () => {
    const result = folderDetailHookDataContract.safeParse({
      hook_event_name: 'PreToolUse',
      tool_name: '',
      tool_input: { file_path: '/test/file.ts' },
      transcript_path: '/tmp/transcript.jsonl',
    });

    expect(result.success).toBe(false);
  });

  it('INVALID: {tool_input.file_path: 42} => fails', () => {
    const result = folderDetailHookDataContract.safeParse({
      hook_event_name: 'PreToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 42 as never },
      transcript_path: '/tmp/transcript.jsonl',
    });

    expect(result.success).toBe(false);
  });
});

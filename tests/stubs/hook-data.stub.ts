import type {
  HookData,
  PreToolUseHookData,
  PostToolUseHookData,
  WriteToolInput,
  EditToolInput,
  MultiEditToolInput,
} from '../../src/types/hooks';

// Base stub for generic hook data
export const HookDataStub = (overrides: Partial<HookData> = {}): HookData => {
  const base = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/test/file.ts',
      content: '',
    },
  };
  return { ...base, ...overrides } as HookData;
};

// Specific stubs for PreToolUse
export const PreToolUseHookStub = (
  overrides: Partial<PreToolUseHookData> = {},
): PreToolUseHookData => {
  const base: PreToolUseHookData = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/test/file.ts',
      content: '',
    },
  };
  return { ...base, ...overrides };
};

// Specific stubs for PostToolUse
export const PostToolUseHookStub = (
  overrides: Partial<PostToolUseHookData> = {},
): PostToolUseHookData => {
  const base: PostToolUseHookData = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/test/file.ts',
      content: '',
    },
  };
  return { ...base, ...overrides };
};

// Tool-specific stubs
export const WriteToolHookStub = (
  overrides: Partial<PreToolUseHookData> & { tool_input?: Partial<WriteToolInput> } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  const base: PreToolUseHookData = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: tool_input?.file_path || '/test/file.ts',
      content: tool_input?.content || '',
    },
  };
  return { ...base, ...rest };
};

export const EditToolHookStub = (
  overrides: Partial<PreToolUseHookData> & { tool_input?: Partial<EditToolInput> } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  const base: PreToolUseHookData = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: {
      file_path: tool_input?.file_path || '/test/file.ts',
      old_string: tool_input?.old_string || 'old',
      new_string: tool_input?.new_string || 'new',
      replace_all: tool_input?.replace_all,
    },
  };
  return { ...base, ...rest };
};

export const MultiEditToolHookStub = (
  overrides: Partial<PreToolUseHookData> & { tool_input?: Partial<MultiEditToolInput> } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  const base: PreToolUseHookData = {
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: tool_input?.file_path || '/test/file.ts',
      edits: tool_input?.edits || [],
    },
  };
  return { ...base, ...rest };
};

import type { z } from 'zod';
import type { PreToolUseHookData } from './pre-tool-use-hook-data-contract';
import { preToolUseHookDataContract } from './pre-tool-use-hook-data-contract';
import { writeToolInputContract } from '../write-tool-input/write-tool-input-contract';
import { editToolInputContract } from '../edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../multi-edit-tool-input/multi-edit-tool-input-contract';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const PreToolUseHookStub = (
  overrides: UnbrandedInput<typeof preToolUseHookDataContract> = {},
): PreToolUseHookData =>
  preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: writeToolInputContract.parse({
      file_path: '/test/file.ts',
      content: '',
    }),
    ...overrides,
  });

export const WriteToolHookStub = (
  overrides: UnbrandedInput<typeof preToolUseHookDataContract> & {
    tool_input?: UnbrandedInput<typeof writeToolInputContract>;
  } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: writeToolInputContract.parse({
      file_path: tool_input?.file_path ?? '/test/file.ts',
      content: tool_input?.content ?? '',
    }),
    ...rest,
  });
};

export const EditToolHookStub = (
  overrides: UnbrandedInput<typeof preToolUseHookDataContract> & {
    tool_input?: UnbrandedInput<typeof editToolInputContract>;
  } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: editToolInputContract.parse({
      file_path: tool_input?.file_path ?? '/test/file.ts',
      old_string: tool_input?.old_string ?? 'old',
      new_string: tool_input?.new_string ?? 'new',
      ...(tool_input?.replace_all !== undefined && { replace_all: tool_input.replace_all }),
    }),
    ...rest,
  });
};

export const MultiEditToolHookStub = (
  overrides: UnbrandedInput<typeof preToolUseHookDataContract> & {
    tool_input?: UnbrandedInput<typeof multiEditToolInputContract>;
  } = {},
): PreToolUseHookData => {
  const { tool_input, ...rest } = overrides;
  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: multiEditToolInputContract.parse({
      file_path: tool_input?.file_path ?? '/test/file.ts',
      edits: tool_input?.edits ?? [],
    }),
    ...rest,
  });
};

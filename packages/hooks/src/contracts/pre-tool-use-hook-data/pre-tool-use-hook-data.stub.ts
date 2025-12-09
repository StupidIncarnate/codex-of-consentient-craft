import type { PreToolUseHookData } from './pre-tool-use-hook-data-contract';
import { preToolUseHookDataContract } from './pre-tool-use-hook-data-contract';
import { writeToolInputContract } from '../write-tool-input/write-tool-input-contract';
import { editToolInputContract } from '../edit-tool-input/edit-tool-input-contract';
import { multiEditToolInputContract } from '../multi-edit-tool-input/multi-edit-tool-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import type { WriteToolInput } from '../write-tool-input/write-tool-input-contract';
import type { EditToolInput } from '../edit-tool-input/edit-tool-input-contract';
import type { MultiEditToolInput } from '../multi-edit-tool-input/multi-edit-tool-input-contract';

export const PreToolUseHookStub = ({
  ...props
}: StubArgument<PreToolUseHookData> = {}): PreToolUseHookData =>
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
    ...props,
  });

export const WriteToolHookStub = ({
  ...props
}: StubArgument<PreToolUseHookData> = {}): PreToolUseHookData => {
  const toolInput =
    'tool_input' in props
      ? (props.tool_input as StubArgument<WriteToolInput> | undefined)
      : undefined;
  const { tool_input: _removed, ...restProps } = props as { tool_input?: unknown };

  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: writeToolInputContract.parse({
      file_path: toolInput?.file_path ?? '/test/file.ts',
      content: toolInput?.content ?? '',
    }),
    ...restProps,
  });
};

export const EditToolHookStub = ({
  ...props
}: StubArgument<PreToolUseHookData> = {}): PreToolUseHookData => {
  const toolInput =
    'tool_input' in props
      ? (props.tool_input as StubArgument<EditToolInput> | undefined)
      : undefined;
  const { tool_input: _removed, ...restProps } = props as { tool_input?: unknown };

  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: editToolInputContract.parse({
      file_path: toolInput?.file_path ?? '/test/file.ts',
      old_string: toolInput?.old_string ?? 'old',
      new_string: toolInput?.new_string ?? 'new',
      ...(toolInput?.replace_all !== undefined && { replace_all: toolInput.replace_all }),
    }),
    ...restProps,
  });
};

export const MultiEditToolHookStub = ({
  ...props
}: StubArgument<PreToolUseHookData> = {}): PreToolUseHookData => {
  const toolInput =
    'tool_input' in props
      ? (props.tool_input as StubArgument<MultiEditToolInput> | undefined)
      : undefined;
  const { tool_input: _removed, ...restProps } = props as { tool_input?: unknown };

  return preToolUseHookDataContract.parse({
    session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_name: 'MultiEdit',
    tool_input: multiEditToolInputContract.parse({
      file_path: toolInput?.file_path ?? '/test/file.ts',
      edits: toolInput?.edits ?? [],
    }),
    ...restProps,
  });
};

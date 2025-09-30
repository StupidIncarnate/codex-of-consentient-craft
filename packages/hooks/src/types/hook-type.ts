import type { ToolInput, ToolResponse } from './tool-type';

export interface PreToolUseHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: ToolInput;
}

export interface PostToolUseHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: ToolInput;
  tool_response?: ToolResponse; // Per Claude Code docs, PostToolUse includes tool_response
}

export interface UserPromptSubmitHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'UserPromptSubmit';
  user_prompt: string;
}

export interface BaseHookData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
}

export type HookData =
  | PreToolUseHookData
  | PostToolUseHookData
  | UserPromptSubmitHookData
  | BaseHookData;

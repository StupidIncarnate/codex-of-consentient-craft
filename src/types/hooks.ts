// Tool Input Types
export type WriteToolInput = {
  file_path: string;
  content: string;
};

export type EditToolInput = {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
};

export type MultiEditToolInput = {
  file_path: string;
  edits: Array<{
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }>;
};

export type ToolInput = WriteToolInput | EditToolInput | MultiEditToolInput;

// Tool Response Types (from Claude Code documentation)
export type ToolResponse = {
  filePath?: string;
  success?: boolean;
  // Additional fields depend on the specific tool
};

// Hook Event Types
export type PreToolUseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: ToolInput;
};

export type PostToolUseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: ToolInput;
  tool_response?: ToolResponse; // Per Claude Code docs, PostToolUse includes tool_response
};

export type UserPromptSubmitHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'UserPromptSubmit';
  user_prompt: string;
};

export type BaseHookData = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
};

// Union type for all hook data
export type HookData =
  | PreToolUseHookData
  | PostToolUseHookData
  | UserPromptSubmitHookData
  | BaseHookData;

// ESLint Types (used in sanitation hook)
export type EslintMessage = {
  line: number;
  message: string;
  severity: number;
  ruleId?: string;
};

export type EslintResult = {
  messages: EslintMessage[];
  output?: string;
};

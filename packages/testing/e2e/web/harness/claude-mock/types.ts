import type { ExitCode, SessionId } from '@dungeonmaster/shared/contracts';

export interface StreamJsonUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

export interface ToolUseConfig {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeResponse {
  sessionId: SessionId;
  lines: string[];
  exitCode?: ExitCode;
  delayMs?: number;
}

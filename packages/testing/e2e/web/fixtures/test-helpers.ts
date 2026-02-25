import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { APIRequestContext } from '@playwright/test';

export { queueClaudeResponse, clearClaudeQueue } from '../harness/claude-mock/queue-helpers';
export {
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  ResumeResponseStub,
  MultiTurnResponseStubs,
} from '../harness/claude-mock/claude-response-stubs';

export const cleanGuilds = async (request: APIRequestContext): Promise<void> => {
  const response = await request.get('/api/guilds');
  const guilds = await response.json();
  for (const guild of guilds) {
    await request.delete(`/api/guilds/${guild.id}`);
  }
};

export const createGuild = async (
  request: APIRequestContext,
  { name, path: guildPath }: { name: string; path: string },
): Promise<Record<string, unknown>> => {
  const response = await request.post('/api/guilds', {
    data: { name, path: guildPath },
  });
  return response.json();
};

export const createQuest = async (
  request: APIRequestContext,
  { guildId, title, userRequest }: { guildId: string; title: string; userRequest: string },
): Promise<{ questId: string; success: boolean }> => {
  const response = await request.post('/api/quests', {
    data: { guildId, title, userRequest },
  });
  return response.json();
};

/**
 * Writes a JSONL session file to disk so it appears in the session list.
 * The session list endpoint scans ~/.claude/projects/<encoded-path>/*.jsonl.
 */
export const createSessionFile = ({
  guildPath,
  sessionId,
  userMessage,
}: {
  guildPath: string;
  sessionId: string;
  userMessage: string;
}): void => {
  const homeDir = os.homedir();
  const encodedPath = guildPath.replace(/\//gu, '-');
  const jsonlDir = path.join(homeDir, '.claude', 'projects', encodedPath);
  const jsonlPath = path.join(jsonlDir, `${sessionId}.jsonl`);

  fs.mkdirSync(jsonlDir, { recursive: true });

  const entry = JSON.stringify({
    type: 'user',
    message: { role: 'user', content: userMessage },
  });
  fs.writeFileSync(jsonlPath, entry + '\n');
};

/**
 * Cleans up session JSONL files for a guild path.
 */
export const cleanSessionFiles = ({ guildPath }: { guildPath: string }): void => {
  const homeDir = os.homedir();
  const encodedPath = guildPath.replace(/\//gu, '-');
  const jsonlDir = path.join(homeDir, '.claude', 'projects', encodedPath);

  try {
    const files = fs.readdirSync(jsonlDir).filter((f: string) => f.endsWith('.jsonl'));
    for (const file of files) {
      fs.unlinkSync(path.join(jsonlDir, file));
    }
  } catch {
    // Directory may not exist
  }
};

/**
 * Removes the entire encoded-path directory recursively, including subagent
 * subdirectories that cleanSessionFiles would miss.
 */
export const cleanSessionDirectory = ({ guildPath }: { guildPath: string }): void => {
  const homeDir = os.homedir();
  const encodedPath = guildPath.replace(/\//gu, '-');
  const jsonlDir = path.join(homeDir, '.claude', 'projects', encodedPath);

  fs.rmSync(jsonlDir, { recursive: true, force: true });
};

/**
 * Writes main session JSONL and subagent JSONL to disk for replay testing.
 * The main JSONL contains a Task tool_use chain; the subagent JSONL contains
 * the sub-agent's own output.
 */
export const createSubagentSessionFiles = ({
  guildPath,
  sessionId,
  agentId,
  toolUseId,
  userMessage,
  mainAssistantText,
  subagentText,
}: {
  guildPath: string;
  sessionId: string;
  agentId: string;
  toolUseId: string;
  userMessage: string;
  mainAssistantText: string;
  subagentText: string;
}): void => {
  const homeDir = os.homedir();
  const encodedPath = guildPath.replace(/\//gu, '-');
  const jsonlDir = path.join(homeDir, '.claude', 'projects', encodedPath);

  // Main session JSONL
  const mainLines = [
    // User message
    JSON.stringify({
      type: 'user',
      message: { role: 'user', content: userMessage },
    }),
    // Assistant with Task tool_use
    JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: toolUseId,
            name: 'Task',
            input: { description: 'Sub-agent work', prompt: 'Do the thing' },
          },
        ],
      },
    }),
    // User tool_result with agentId (dungeonmaster extension)
    JSON.stringify({
      type: 'user',
      message: {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'done' }],
      },
      toolUseResult: { agentId },
    }),
    // Follow-up assistant text
    JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: mainAssistantText }],
        usage: { input_tokens: 200, output_tokens: 80 },
      },
    }),
  ];

  fs.mkdirSync(jsonlDir, { recursive: true });
  fs.writeFileSync(path.join(jsonlDir, `${sessionId}.jsonl`), mainLines.join('\n') + '\n');

  // Subagent JSONL in subagents/ directory
  const subagentDir = path.join(jsonlDir, sessionId, 'subagents');
  fs.mkdirSync(subagentDir, { recursive: true });

  const subagentLines = [
    JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: subagentText }],
        usage: { input_tokens: 50, output_tokens: 20 },
      },
    }),
  ];

  fs.writeFileSync(path.join(subagentDir, `${agentId}.jsonl`), subagentLines.join('\n') + '\n');
};

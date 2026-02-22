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

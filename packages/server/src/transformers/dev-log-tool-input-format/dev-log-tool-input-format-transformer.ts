/**
 * PURPOSE: Formats tool_use input into a compact detail string showing the most useful field per tool
 *
 * USAGE:
 * devLogToolInputFormatTransformer({ toolName: 'Read', input: { file_path: '/home/.../file.ts' } });
 * // Returns DevLogLine '.../src/file.ts'
 */

import { devLogToolInputContract } from '../../contracts/dev-log-tool-input/dev-log-tool-input-contract';
import { devLogShortIdTransformer } from '../dev-log-short-id/dev-log-short-id-transformer';

const TOOL_CMD_PREVIEW_LENGTH = 60;
const TEXT_PREVIEW_LENGTH = 60;
const PATH_TAIL_SEGMENTS = 3;

export const devLogToolInputFormatTransformer = ({
  toolName,
  input,
}: {
  toolName: string;
  input: Record<PropertyKey, unknown>;
}): string => {
  const parsed = devLogToolInputContract.parse(input);
  if (toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') {
    const fp = parsed.file_path;
    if (fp === undefined) return '';
    const parts = fp.split('/');
    return (parts.length <= PATH_TAIL_SEGMENTS ? fp : `.../${parts.slice(-PATH_TAIL_SEGMENTS).join('/')}`);
  }
  if (toolName === 'Bash') {
    const cmd = parsed.command;
    if (cmd === undefined) return '';
    return (cmd.length > TOOL_CMD_PREVIEW_LENGTH
        ? `"${cmd.slice(0, TOOL_CMD_PREVIEW_LENGTH)}..."`
        : `"${cmd}"`);
  }
  if (toolName === 'Grep') {
    return (parsed.pattern === undefined ? '' : `pattern:"${parsed.pattern}"`);
  }
  if (toolName === 'Glob') {
    return (parsed.pattern === undefined ? '' : `"${parsed.pattern}"`);
  }
  if (toolName === 'Agent') {
    return (parsed.description === undefined ? '' : `"${parsed.description}"`);
  }
  if (toolName === 'TaskCreate') {
    return (parsed.subject === undefined ? '' : `"${parsed.subject.slice(0, TEXT_PREVIEW_LENGTH)}"`);
  }
  if (toolName === 'TaskUpdate') {
    return `task:${String(parsed.taskId)}  ${String(parsed.status)}`;
  }
  if (toolName.startsWith('mcp__dungeonmaster__')) {
    if (parsed.questId !== undefined) {
      return `quest:${devLogShortIdTransformer({ id: parsed.questId })}`;
    }
    if (parsed.guildId !== undefined) {
      return `guild:${devLogShortIdTransformer({ id: parsed.guildId })}`;
    }
    return '';
  }
  return '';
};

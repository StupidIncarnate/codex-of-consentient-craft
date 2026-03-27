/**
 * PURPOSE: Formats tool_use input into a compact detail string showing the most useful field per tool
 *
 * USAGE:
 * devLogToolInputFormatTransformer({ toolName: 'Read', input: { file_path: '/home/.../file.ts' } });
 * // Returns DevLogLine '.../src/file.ts'
 */

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
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
}): DevLogLine => {
  if (toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') {
    const fp = Reflect.get(input, 'file_path');
    if (typeof fp !== 'string') return devLogLineContract.parse('');
    const parts = fp.split('/');
    return devLogLineContract.parse(
      parts.length <= PATH_TAIL_SEGMENTS ? fp : `.../${parts.slice(-PATH_TAIL_SEGMENTS).join('/')}`,
    );
  }
  if (toolName === 'Bash') {
    const cmd = Reflect.get(input, 'command');
    if (typeof cmd !== 'string') return devLogLineContract.parse('');
    return devLogLineContract.parse(
      cmd.length > TOOL_CMD_PREVIEW_LENGTH
        ? `"${cmd.slice(0, TOOL_CMD_PREVIEW_LENGTH)}..."`
        : `"${cmd}"`,
    );
  }
  if (toolName === 'Grep') {
    const pattern = Reflect.get(input, 'pattern');
    return devLogLineContract.parse(typeof pattern === 'string' ? `pattern:"${pattern}"` : '');
  }
  if (toolName === 'Glob') {
    const pattern = Reflect.get(input, 'pattern');
    return devLogLineContract.parse(typeof pattern === 'string' ? `"${pattern}"` : '');
  }
  if (toolName === 'Agent') {
    const desc = Reflect.get(input, 'description');
    return devLogLineContract.parse(typeof desc === 'string' ? `"${desc}"` : '');
  }
  if (toolName === 'TaskCreate') {
    const subject = Reflect.get(input, 'subject');
    return devLogLineContract.parse(
      typeof subject === 'string' ? `"${subject.slice(0, TEXT_PREVIEW_LENGTH)}"` : '',
    );
  }
  if (toolName === 'TaskUpdate') {
    const taskId = Reflect.get(input, 'taskId');
    const status = Reflect.get(input, 'status');
    return devLogLineContract.parse(`task:${String(taskId)}  ${String(status)}`);
  }
  if (toolName.startsWith('mcp__dungeonmaster__')) {
    const questId = Reflect.get(input, 'questId');
    if (typeof questId === 'string')
      return devLogLineContract.parse(`quest:${devLogShortIdTransformer({ id: questId })}`);
    const guildId = Reflect.get(input, 'guildId');
    if (typeof guildId === 'string')
      return devLogLineContract.parse(`guild:${devLogShortIdTransformer({ id: guildId })}`);
    return devLogLineContract.parse('');
  }
  return devLogLineContract.parse('');
};

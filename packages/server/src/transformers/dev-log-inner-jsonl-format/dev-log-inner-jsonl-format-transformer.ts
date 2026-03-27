/**
 * PURPOSE: Formats a parsed inner JSONL entry (system, assistant, user, progress, rate_limit) into a compact label
 *
 * USAGE:
 * devLogInnerJsonlFormatTransformer({ parsed: { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read' }] } } });
 * // Returns DevLogLine 'assistant/tool_use  Read  .../file.ts'
 */

import {
  devLogLineContract,
  type DevLogLine,
} from '../../contracts/dev-log-line/dev-log-line-contract';
import { devLogShortIdTransformer } from '../dev-log-short-id/dev-log-short-id-transformer';
import { devLogToolInputFormatTransformer } from '../dev-log-tool-input-format/dev-log-tool-input-format-transformer';

const TEXT_PREVIEW_LENGTH = 60;

export const devLogInnerJsonlFormatTransformer = ({
  parsed,
}: {
  parsed: Record<PropertyKey, unknown>;
}): DevLogLine => {
  const rawType: unknown = Reflect.get(parsed, 'type');
  const innerType = typeof rawType === 'string' ? rawType : '?';

  if (innerType === 'system') {
    const subtype = Reflect.get(parsed, 'subtype');
    const sub = typeof subtype === 'string' ? subtype : '?';
    if (sub === 'turn_duration') {
      const ms: unknown = Reflect.get(parsed, 'durationMs');
      const msLabel = typeof ms === 'number' ? `${ms}` : '?';
      return devLogLineContract.parse(`system/turn_duration  ${msLabel}ms`);
    }
    if (sub === 'hook_started' || sub === 'hook_response') {
      const hookId = Reflect.get(parsed, 'hook_id');
      const hookLabel =
        typeof hookId === 'string' ? `  hook:${devLogShortIdTransformer({ id: hookId })}` : '';
      return devLogLineContract.parse(`system/${sub}${hookLabel}`);
    }
    return devLogLineContract.parse(`system/${sub}`);
  }

  if (innerType === 'assistant') {
    const message = Reflect.get(parsed, 'message');
    if (typeof message !== 'object' || message === null)
      return devLogLineContract.parse('assistant');
    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content) || content.length === 0)
      return devLogLineContract.parse('assistant  (empty)');

    const rawBlock: unknown = Reflect.get(content, 0);
    const firstBlock =
      typeof rawBlock === 'object' && rawBlock !== null
        ? (rawBlock as Record<PropertyKey, unknown>)
        : {};
    const rawBlockType: unknown = Reflect.get(firstBlock, 'type');
    const blockType = typeof rawBlockType === 'string' ? rawBlockType : '?';

    if (blockType === 'tool_use') {
      const rawName: unknown = Reflect.get(firstBlock, 'name');
      const toolName = typeof rawName === 'string' ? rawName : '?';
      const input = Reflect.get(firstBlock, 'input');
      const detail = devLogToolInputFormatTransformer({
        toolName,
        input:
          typeof input === 'object' && input !== null
            ? (input as Record<PropertyKey, unknown>)
            : {},
      });
      const detailStr = detail;
      const suffix = detailStr ? `  ${detailStr}` : '';
      return devLogLineContract.parse(`assistant/tool_use  ${toolName}${suffix}`);
    }
    if (blockType === 'text') {
      const rawText: unknown = Reflect.get(firstBlock, 'text');
      const text = typeof rawText === 'string' ? rawText : '';
      const preview =
        text.length > TEXT_PREVIEW_LENGTH ? `${text.slice(0, TEXT_PREVIEW_LENGTH)}...` : text;
      return devLogLineContract.parse(`assistant/text  "${preview}"`);
    }
    if (blockType === 'thinking') return devLogLineContract.parse('assistant/thinking');

    return devLogLineContract.parse(`assistant/${blockType}`);
  }

  if (innerType === 'user') {
    const message = Reflect.get(parsed, 'message');
    if (typeof message !== 'object' || message === null) return devLogLineContract.parse('user');
    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content) || content.length === 0)
      return devLogLineContract.parse('user  (empty)');

    const rawBlock: unknown = Reflect.get(content, 0);
    const firstBlock =
      typeof rawBlock === 'object' && rawBlock !== null
        ? (rawBlock as Record<PropertyKey, unknown>)
        : {};
    const rawBlockType: unknown = Reflect.get(firstBlock, 'type');
    const blockType = typeof rawBlockType === 'string' ? rawBlockType : '?';

    if (blockType === 'tool_result') {
      const rawToolUseId: unknown = Reflect.get(firstBlock, 'tool_use_id');
      const toolUseId = typeof rawToolUseId === 'string' ? rawToolUseId : '';
      const isError = Reflect.get(firstBlock, 'is_error') === true;
      const idLabel = toolUseId ? devLogShortIdTransformer({ id: toolUseId }) : '';
      return devLogLineContract.parse(
        `user/tool_result  ${idLabel}  ${isError ? 'error' : 'ok'}`.trim(),
      );
    }
    if (blockType === 'text') {
      const rawText: unknown = Reflect.get(firstBlock, 'text');
      const text = typeof rawText === 'string' ? rawText : '';
      const preview =
        text.length > TEXT_PREVIEW_LENGTH ? `${text.slice(0, TEXT_PREVIEW_LENGTH)}...` : text;
      return devLogLineContract.parse(`user/text  "${preview}"`);
    }
    return devLogLineContract.parse(`user/${blockType}`);
  }

  if (innerType === 'progress') {
    const data = Reflect.get(parsed, 'data');
    if (typeof data !== 'object' || data === null) return devLogLineContract.parse('progress');
    const rawProgressType: unknown = Reflect.get(data, 'type');
    const progressType = typeof rawProgressType === 'string' ? rawProgressType : '?';
    const hookName: unknown = Reflect.get(data, 'hookName');
    return devLogLineContract.parse(
      typeof hookName === 'string'
        ? `progress/${progressType}  ${hookName}`
        : `progress/${progressType}`,
    );
  }

  if (innerType === 'rate_limit_event') {
    const info = Reflect.get(parsed, 'rate_limit_info');
    if (typeof info !== 'object' || info === null) return devLogLineContract.parse('rate_limit');
    const rawStatus: unknown = Reflect.get(info, 'status');
    const status = typeof rawStatus === 'string' ? rawStatus : '';
    return devLogLineContract.parse(`rate_limit  ${status}`.trim());
  }

  return devLogLineContract.parse(innerType);
};

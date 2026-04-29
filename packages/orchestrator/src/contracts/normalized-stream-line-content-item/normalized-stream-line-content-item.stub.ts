import type { StubArgument } from '@dungeonmaster/shared/@types';

import { normalizedStreamLineContentItemContract } from './normalized-stream-line-content-item-contract';
import type { NormalizedStreamLineContentItem } from './normalized-stream-line-content-item-contract';

/**
 * Default content item — text variant. Preserves backward-compat with existing call sites.
 * Use the named variant stubs below for scenario-specific test data.
 */
export const NormalizedStreamLineContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'text',
    text: 'Hello world',
    ...props,
  });

/**
 * Text block variant — Claude emitting plain text inside an assistant message.
 * Wire shape (post-normalization): { type: 'text', text: '<content>' }
 */
export const NormalizedTextContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'text',
    text: 'Hello world',
    ...props,
  });

/**
 * Tool_use block variant — Claude invoking a tool (Bash, Read, Task, Agent, MCP tools, etc.)
 * Wire shape (post-normalization): { type: 'tool_use', id: 'toolu_01...', name: 'Task', input: {...} }
 */
export const NormalizedToolUseContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'tool_use',
    id: 'toolu_01TestToolUse',
    name: 'Bash',
    input: {},
    ...props,
  });

/**
 * Tool_result block variant — string content form.
 * Wire shape (post-normalization): { type: 'tool_result', toolUseId: 'toolu_01...', content: 'text' }
 * Occurs when a tool returns a plain text result (most common case for Bash/Read/Glob).
 */
export const NormalizedToolResultStringContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'tool_result',
    toolUseId: 'toolu_01TestToolResult',
    content: 'Tool output text',
    ...props,
  });

/**
 * Tool_result block variant — array-of-content-items form.
 * Wire shape (post-normalization): { type: 'tool_result', toolUseId: '...', content: [{type:'text', text:'...'}, ...] }
 * Occurs when a tool returns structured content (e.g., multi-block results, tool_reference items from MCP).
 * The `tool_reference` type inside content is the known rendering bug tracked by
 * `mapContentItemToChatEntryTransformer` — it only extracts `.text` from array items, so
 * `tool_reference` blocks (which have no `.text`) are silently dropped.
 */
export const NormalizedToolResultArrayContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'tool_result',
    toolUseId: 'toolu_01TestToolResultArray',
    content: [
      { type: 'text', text: 'Line one' },
      { type: 'text', text: 'Line two' },
    ],
    ...props,
  });

/**
 * Thinking block variant — Claude extended thinking content.
 * Wire shape (post-normalization): { type: 'thinking', thinking: '<reasoning>', signature?: '<sig>' }
 * Empty-thinking blocks (thinking: '') are filtered by chat-line-process-transformer before reaching consumers.
 */
export const NormalizedThinkingContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'thinking',
    thinking: 'Let me reason through this carefully.',
    ...props,
  });

/**
 * Redacted thinking block variant — encrypted/opaque thinking block.
 * Wire shape (post-normalization): { type: 'redacted_thinking', data: '<encrypted blob>' }
 * Claude emits these when extended thinking content is redacted for safety reasons.
 * No transformer in the current pipeline handles this variant — it is silently dropped by
 * mapContentItemToChatEntryTransformer (returns null).
 */
export const NormalizedRedactedThinkingContentItemStub = ({
  ...props
}: StubArgument<NormalizedStreamLineContentItem> = {}): NormalizedStreamLineContentItem =>
  normalizedStreamLineContentItemContract.parse({
    type: 'redacted_thinking',
    data: '<encrypted-redacted-thinking-blob>',
    ...props,
  });

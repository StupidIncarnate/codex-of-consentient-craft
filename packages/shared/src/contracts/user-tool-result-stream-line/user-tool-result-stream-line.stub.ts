import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ToolReferenceBlockParamStub } from '../tool-reference-block-param/tool-reference-block-param.stub';
import { Base64ImageBlockParamStub } from '../image-block-param/image-block-param.stub';
import { UrlDocumentBlockParamStub } from '../document-block-param/document-block-param.stub';
import { SearchResultBlockParamStub } from '../search-result-block-param/search-result-block-param.stub';
import { TextBlockParamStub } from '../text-block-param/text-block-param.stub';
import { userToolResultStreamLineContract } from './user-tool-result-stream-line-contract';
import type { UserToolResultStreamLine } from './user-tool-result-stream-line-contract';

/**
 * MCP tool permission denied - agent calls a tool the user hasn't approved yet.
 * Claude CLI returns this as a user message with is_error: true.
 */
export const PermissionDeniedStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_016sbUuxidMBZVMKM9jpHsqK',
          content:
            "Claude requested permissions to use mcp__dungeonmaster__list-guilds, but you haven't granted it yet.",
          is_error: true,
        },
      ],
    },
    ...props,
  });

/**
 * Successful tool result - tool executed and returned output.
 * Standard tool completion path with content from the tool.
 */
export const SuccessfulToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
          content: 'File contents retrieved successfully',
        },
      ],
    },
    ...props,
  });

/**
 * Mixed user message - text prompt alongside a tool result.
 * Occurs when Claude CLI bundles user text with a pending tool result in the same message.
 */
export const MixedTextAndToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'User follow-up message',
        },
        {
          type: 'tool_result',
          tool_use_id: 'toolu_015sb5Rz8yPMN4sbwdNaz8kk',
          content: 'Read 42 lines from file',
        },
      ],
    },
    ...props,
  });

/**
 * User message with only text content - no tool results.
 * Represents a plain user prompt with no tool result items to extract.
 */
export const TextOnlyUserStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Just a user message',
        },
      ],
    },
    ...props,
  });

/**
 * Task tool result closing out a sub-agent dispatch - carries toolUseResult.agentId.
 * Emitted in the PARENT session's JSONL after a Task tool completes; the `toolUseResult.agentId`
 * field correlates this result back to the subagent's JSONL file. The chat-line processor
 * uses this field to stamp `agentId` onto the matching assistant Task tool_use entry.
 */
export const TaskToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01TaskDispatch7890abcd',
          content: 'done',
        },
      ],
    },
    toolUseResult: { agentId: 'subagent-correlation-id' },
    ...props,
  });

/**
 * ask-user-question tool result - MCP tool acknowledgement that the question was sent to the user.
 * Emitted immediately after the assistant invokes `mcp__dungeonmaster__ask-user-question`. The
 * assistant then pauses until the user answers via the UI; the answer arrives as the NEXT user text
 * message (not as a tool_result). Tests exercising the clarification flow must pair this with the
 * assistant tool_use stub and a following UserTextStringStreamLineStub for the user's answer.
 */
export const AskUserQuestionToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01AskUserQuestion7890',
          content: 'Questions sent to user. Their answers will arrive as your next user message.',
        },
      ],
    },
    ...props,
  });

/**
 * Tool result whose content is an array of tool_reference blocks — emitted by the real Claude
 * CLI after a ToolSearch tool invocation. Each element references a tool by name rather than
 * returning a flat string. Transformers that handle tool_result.content must not assume string.
 */
export const ToolReferenceArrayToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01ToolSearch1234abcd',
          content: [
            ToolReferenceBlockParamStub({ tool_name: 'mcp__dungeonmaster__get-quest' }),
            ToolReferenceBlockParamStub({ tool_name: 'mcp__dungeonmaster__list-quests' }),
          ],
        },
      ],
    },
    ...props,
  });

/**
 * Tool result whose content is an array containing an image block — emitted when a tool
 * returns visual output (e.g., a screenshot tool or image-generation MCP). The image arrives
 * as a base64 block inside the tool_result content array rather than a plain string.
 */
export const ImageArrayToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01Screenshot5678efgh',
          content: [Base64ImageBlockParamStub()],
        },
      ],
    },
    ...props,
  });

/**
 * Tool result whose content is an array containing a document block — emitted when a tool
 * returns a structured document (e.g., a PDF reader or document-fetch MCP). The document
 * block carries a URL source rather than a flat string.
 */
export const DocumentArrayToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01DocFetch9012ijkl',
          content: [UrlDocumentBlockParamStub()],
        },
      ],
    },
    ...props,
  });

/**
 * Tool result whose content is an array containing a search_result block — emitted when a
 * web-search tool returns results in structured block form. Each search_result carries a
 * source URL, title, and an array of text blocks for the extracted content.
 */
export const SearchResultArrayToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01WebSearch3456mnop',
          content: [SearchResultBlockParamStub()],
        },
      ],
    },
    ...props,
  });

/**
 * Tool result whose content is a mixed array of text and tool_reference blocks — emitted
 * when a tool returns a combination of descriptive text and named tool references. Mirrors
 * the real ToolSearch output format where result entries interleave plain text with references.
 */
export const MixedArrayToolResultStreamLineStub = ({
  ...props
}: StubArgument<UserToolResultStreamLine> = {}): UserToolResultStreamLine =>
  userToolResultStreamLineContract.parse({
    type: 'user',
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_01MixedArray7890qrst',
          content: [
            TextBlockParamStub({ text: 'Found the following tools:' }),
            ToolReferenceBlockParamStub({ tool_name: 'mcp__dungeonmaster__discover' }),
          ],
        },
      ],
    },
    ...props,
  });

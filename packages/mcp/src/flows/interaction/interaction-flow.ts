/**
 * PURPOSE: Returns ToolRegistration[] for interaction MCP tools (signal-back, ask-user-question,
 * get-agent-prompt)
 *
 * USAGE:
 * const registrations = InteractionFlow();
 * // Returns 3 ToolRegistration objects that delegate to InteractionHandleResponder
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';
import { toJSONSchema } from '#gateway/npm/zod';

import { getAgentPromptInputContract } from '../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import { signalBackInputContract } from '../../contracts/signal-back-input/signal-back-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';
import { InteractionHandleResponder } from '../../responders/interaction/handle/interaction-handle-responder';
import { toolRegistrationContract } from '../../contracts/tool-registration/tool-registration-contract';

// `reused: 'inline'` is zod v4's native replacement for the deprecated `zod-to-json-schema`
// package's `$refStrategy: 'none'` (see quest-flow.ts's own comment on this same constant for why
// the npm package itself no longer converts a real v4 schema at all).
const jsonSchemaOptions = { reused: 'inline' as const };
const signalBackSchema = toJSONSchema(signalBackInputContract, jsonSchemaOptions);
const askUserQuestionSchema = toJSONSchema(askUserQuestionContract, jsonSchemaOptions);
const getAgentPromptSchema = toJSONSchema(getAgentPromptInputContract, jsonSchemaOptions);

export const InteractionFlow = (): ToolRegistration[] => [
  {
    ...toolRegistrationContract.parse({
      name: 'signal-back',
      description: 'Signals the CLI with step completion status, progress, or blocking conditions',
      inputSchema: signalBackSchema,
    }),
    handler: async ({ args, meta }): Promise<CallToolResult> =>
      InteractionHandleResponder({
        tool: 'signal-back',
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'ask-user-question',
      description:
        "Ask the user clarifying questions with structured options. Fire-and-forget: returns immediately. The questions are surfaced to the user's browser and their answers arrive as the next user message in the session. Use when running headless (no interactive terminal).",
      inputSchema: askUserQuestionSchema,
    }),
    handler: async ({ args, meta }): Promise<CallToolResult> =>
      InteractionHandleResponder({
        tool: 'ask-user-question',
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-agent-prompt',
      description:
        'Returns the prompt and configuration for a named agent. Call this first when spawned as an agent to receive your instructions.',
      inputSchema: getAgentPromptSchema,
    }),
    handler: async ({ args, meta }): Promise<CallToolResult> =>
      InteractionHandleResponder({
        tool: 'get-agent-prompt',
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
];

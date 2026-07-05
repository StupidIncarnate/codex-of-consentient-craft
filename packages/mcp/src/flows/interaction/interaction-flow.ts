/**
 * PURPOSE: Returns ToolRegistration[] for interaction MCP tools (signal-back, ask-user-question, get-agent-prompt)
 *
 * USAGE:
 * const registrations = InteractionFlow();
 * // Returns 3 ToolRegistration objects that delegate to InteractionHandleResponder
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { getAgentPromptInputContract } from '../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import { signalBackInputContract } from '../../contracts/signal-back-input/signal-back-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import type { ToolResponse } from '../../contracts/tool-response/tool-response-contract';
import { InteractionHandleResponder } from '../../responders/interaction/handle/interaction-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const signalBackSchema = zodToJsonSchema(signalBackInputContract as never, jsonSchemaOptions);
const askUserQuestionSchema = zodToJsonSchema(askUserQuestionContract as never, jsonSchemaOptions);
const getAgentPromptSchema = zodToJsonSchema(
  getAgentPromptInputContract as never,
  jsonSchemaOptions,
);

export const InteractionFlow = (): ToolRegistration[] => [
  {
    name: 'signal-back' as never,
    description:
      'Signals the CLI with step completion status, progress, or blocking conditions' as never,
    inputSchema: signalBackSchema as never,
    handler: async ({ args, meta }): Promise<ToolResponse> =>
      InteractionHandleResponder({
        tool: 'signal-back' as never,
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    name: 'ask-user-question' as never,
    description:
      "Ask the user clarifying questions with structured options. Fire-and-forget: returns immediately. The questions are surfaced to the user's browser and their answers arrive as the next user message in the session. Use when running headless (no interactive terminal)." as never,
    inputSchema: askUserQuestionSchema as never,
    handler: async ({ args, meta }): Promise<ToolResponse> =>
      InteractionHandleResponder({
        tool: 'ask-user-question' as never,
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
  {
    name: 'get-agent-prompt' as never,
    description:
      'Returns the prompt and configuration for a named agent. Call this first when spawned as an agent to receive your instructions.' as never,
    inputSchema: getAgentPromptSchema as never,
    handler: async ({ args, meta }): Promise<ToolResponse> =>
      InteractionHandleResponder({
        tool: 'get-agent-prompt' as never,
        args,
        ...(meta !== undefined && { meta }),
      }),
  },
];

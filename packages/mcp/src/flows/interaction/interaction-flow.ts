/**
 * PURPOSE: Returns ToolRegistration[] for interaction MCP tools (signal-back, ask-user-question)
 *
 * USAGE:
 * const registrations = InteractionFlow();
 * // Returns 2 ToolRegistration objects that delegate to InteractionHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { askUserQuestionInputContract } from '../../contracts/ask-user-question-input/ask-user-question-input-contract';
import { signalBackInputContract } from '../../contracts/signal-back-input/signal-back-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import type { ToolResponse } from '../../contracts/tool-response/tool-response-contract';
import { InteractionHandleResponder } from '../../responders/interaction/handle/interaction-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const signalBackSchema = zodToJsonSchema(signalBackInputContract as never, jsonSchemaOptions);
const askUserQuestionSchema = zodToJsonSchema(
  askUserQuestionInputContract as never,
  jsonSchemaOptions,
);

export const InteractionFlow = (): ToolRegistration[] => [
  {
    name: 'signal-back' as never,
    description:
      'Signals the CLI with step completion status, progress, or blocking conditions' as never,
    inputSchema: signalBackSchema as never,
    handler: async ({ args }): Promise<ToolResponse> =>
      Promise.resolve(InteractionHandleResponder({ tool: 'signal-back' as never, args })),
  },
  {
    name: 'ask-user-question' as never,
    description:
      "Ask the user clarifying questions with structured options. Fire-and-forget: returns immediately. The user's answers arrive as the next user message in the session." as never,
    inputSchema: askUserQuestionSchema as never,
    handler: async ({ args }): Promise<ToolResponse> =>
      Promise.resolve(InteractionHandleResponder({ tool: 'ask-user-question' as never, args })),
  },
];

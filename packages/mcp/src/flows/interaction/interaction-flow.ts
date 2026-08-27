/**
 * PURPOSE: Returns ToolRegistration[] for interaction MCP tools (signal-back, ask-user-question,
 * get-agent-prompt, and the three minion-family information tools)
 *
 * USAGE:
 * const registrations = InteractionFlow();
 * // Returns 6 ToolRegistration objects that delegate to InteractionHandleResponder
 *
 * THE THREE INFORMATION TOOLS TAKE NO ARGUMENTS, so they advertise `emptySchema` and the size-cap
 * test in `mcp-server-flow.integration.test.ts` exercises each of them automatically. Each returns
 * its markdown as raw text rather than JSON: the caller is reading it, not parsing it, and
 * `JSON.stringify` would escape every newline in a document thousands of lines long.
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { getAgentPromptInputContract } from '../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import { signalBackInputContract } from '../../contracts/signal-back-input/signal-back-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import type { ToolResponse } from '../../contracts/tool-response/tool-response-contract';
import { InteractionHandleResponder } from '../../responders/interaction/handle/interaction-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
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
  {
    name: 'get-planner-information' as never,
    description:
      "Returns everything a PLANNER minion needs that does not depend on which kind of work it is planning: the round document and how to read and append to it, the brief lines that address it, the plan blocks in the order they are built, a chunk's five fields, the two dispatch indexes, its operating rules, the commit it makes, and the two values its `NEXT:` line may carry. Every `<role>-planner-minion` calls this once, before anything else; its own prompt carries what the work IS. Takes no arguments." as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }): Promise<ToolResponse> =>
      InteractionHandleResponder({ tool: 'get-planner-information' as never, args }),
  },
  {
    name: 'get-worker-information' as never,
    description:
      "Returns everything a WORKER minion needs that does not depend on which kind of work its chunk is: the round document and where its report goes, the brief lines that address it, a chunk's five fields read as the session executing one, its operating rules, the build and git bans that make a wave of workers safe to run at once, and the two lines it returns. Every `<role>-worker-minion` calls this once, before anything else; its own prompt carries what doing the chunk MEANS and what proves it. Takes no arguments." as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }): Promise<ToolResponse> =>
      InteractionHandleResponder({ tool: 'get-worker-information' as never, args }),
  },
  {
    name: 'get-reviewer-information' as never,
    description:
      "Returns everything a REVIEWER minion needs that does not depend on which kind of work the round produced: the round document, the plan blocks and chunk fields it grades against, the two dispatch indexes, its operating rules, the build-and-ward pair only it runs, the five standing review concerns and how to record a disposition per unit, the round's commit subjects, and how to write the `NEXT:` line that decides the round. Every `<role>-reviewer-minion` calls this once, before anything else; its own prompt carries what it asks of each file and what it signs. Takes no arguments." as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }): Promise<ToolResponse> =>
      InteractionHandleResponder({ tool: 'get-reviewer-information' as never, args }),
  },
];

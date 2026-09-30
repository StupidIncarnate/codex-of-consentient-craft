/**
 * PURPOSE: Handles interaction MCP tool calls (signal-back, ask-user-question, get-agent-prompt)
 *
 * USAGE:
 * const result = await InteractionHandleResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 * // Returns CallToolResult with interaction result
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { askUserQuestionBroker } from '../../../brokers/ask/user-question/ask-user-question-broker';
import { signalBackBroker } from '../../../brokers/signal/back/signal-back-broker';
import { getAgentPromptInputContract } from '../../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';

const JSON_INDENT_SPACES = 2;

export const InteractionHandleResponder = async ({
  tool,
  args,
}: {
  tool: string;
  args: Record<string, unknown>;
}): Promise<CallToolResult> => {
  if (tool === 'signal-back') {
    const result = signalBackBroker({
      input: args,
    });

    if (result.success) {
      // After validating the signal, apply it server-side: the handler marks the work item
      // terminal and applies its outcome to the ledger atomically, then advances the relay.
      await StartOrchestrator.handleSignalBack({
        questId: result.signal.questId,
        workItemId: result.signal.workItemId,
        signal: result.signal.signal,
        ...(result.signal.operationItemId === undefined
          ? {}
          : { operationItemId: result.signal.operationItemId }),
        ...(result.signal.blockedReason === undefined
          ? {}
          : { blockedReason: result.signal.blockedReason }),
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, JSON_INDENT_SPACES),
        },
      ],
    };
  }

  if (tool === 'ask-user-question') {
    // Fire-and-forget: validate the questions and instruct the agent to wait. The web surfaces the
    // questions to the browser clarify panel by scanning the session stream for this tool call; the
    // user's answers arrive as the agent's next user message when the session resumes.
    const result = askUserQuestionBroker({ input: args });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  if (tool === 'get-agent-prompt') {
    const parsed = getAgentPromptInputContract.safeParse(args);
    if (!parsed.success) {
      throw new Error(`get-agent-prompt requires {agent, questId}: ${parsed.error.message}`);
    }

    const { workItemId } = parsed.data;

    const result = await StartOrchestrator.getAgentPrompt({
      agent: parsed.data.agent,
      questId: parsed.data.questId,
      ...(workItemId !== undefined && { workItemId }),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, JSON_INDENT_SPACES),
        },
      ],
    };
  }

  throw new Error(`Unknown interaction tool: ${tool}`);
};

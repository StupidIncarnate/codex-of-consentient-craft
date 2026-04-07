/**
 * PURPOSE: Handles interaction MCP tool calls (signal-back, ask-user-question, get-agent-prompt)
 *
 * USAGE:
 * const result = await InteractionHandleResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 * // Returns ToolResponse with interaction result
 */

import { signalBackBroker } from '../../../brokers/signal/back/signal-back-broker';
import { askUserQuestionBroker } from '../../../brokers/ask/user-question/ask-user-question-broker';
import { orchestratorGetAgentPromptAdapter } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter';
import { getAgentPromptInputContract } from '../../../contracts/get-agent-prompt-input/get-agent-prompt-input-contract';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

const JSON_INDENT_SPACES = 2;

export const InteractionHandleResponder = ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): ToolResponse => {
  if (tool === 'signal-back') {
    const result = signalBackBroker({
      input: args,
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  if (tool === 'ask-user-question') {
    const result = askUserQuestionBroker({ input: args });

    return {
      content: [{ type: 'text', text: contentTextContract.parse(result) }],
    };
  }

  if (tool === 'get-agent-prompt') {
    const validated = getAgentPromptInputContract.parse(args);
    const result = orchestratorGetAgentPromptAdapter({ agent: validated.agent });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  throw new Error(`Unknown interaction tool: ${String(tool)}`);
};

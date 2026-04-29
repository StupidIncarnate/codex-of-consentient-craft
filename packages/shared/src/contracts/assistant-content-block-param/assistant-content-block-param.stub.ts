import type { StubArgument } from '@dungeonmaster/shared/@types';

import { assistantContentBlockParamContract } from './assistant-content-block-param-contract';
import type { AssistantContentBlockParam } from './assistant-content-block-param-contract';

/**
 * Default assistant content block — a text block, the most common element
 * inside an assistant message.content[] array in Claude CLI JSONL output.
 */
export const AssistantContentBlockParamStub = ({
  ...props
}: StubArgument<AssistantContentBlockParam> = {}): AssistantContentBlockParam =>
  assistantContentBlockParamContract.parse({
    type: 'text',
    text: 'I can help you with that.',
    ...props,
  });

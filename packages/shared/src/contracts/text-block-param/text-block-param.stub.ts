import type { StubArgument } from '@dungeonmaster/shared/@types';

import { textBlockParamContract } from './text-block-param-contract';
import type { TextBlockParam } from './text-block-param-contract';

/**
 * Plain text content block emitted by the assistant — the most common content item
 * in Claude CLI streaming output.
 */
export const TextBlockParamStub = ({
  ...props
}: StubArgument<TextBlockParam> = {}): TextBlockParam =>
  textBlockParamContract.parse({
    type: 'text',
    text: 'Hello, how can I help you today?',
    ...props,
  });

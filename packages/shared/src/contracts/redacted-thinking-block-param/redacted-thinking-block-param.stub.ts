import type { StubArgument } from '@dungeonmaster/shared/@types';

import { redactedThinkingBlockParamContract } from './redacted-thinking-block-param-contract';
import type { RedactedThinkingBlockParam } from './redacted-thinking-block-param-contract';

/**
 * Redacted thinking block — emitted when Claude's extended thinking content is encrypted
 * or hidden for privacy/safety reasons, replaced by an opaque data blob.
 */
export const RedactedThinkingBlockParamStub = ({
  ...props
}: StubArgument<RedactedThinkingBlockParam> = {}): RedactedThinkingBlockParam =>
  redactedThinkingBlockParamContract.parse({
    type: 'redacted_thinking',
    data: 'EncryptedThinkingDataBlob==',
    ...props,
  });

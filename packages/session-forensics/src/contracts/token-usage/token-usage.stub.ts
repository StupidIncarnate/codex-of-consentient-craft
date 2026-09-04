import { tokenUsageContract, type TokenUsage } from './token-usage-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TokenUsageStub = ({ ...props }: StubArgument<TokenUsage> = {}): TokenUsage =>
  tokenUsageContract.parse({
    inputTokens: 2,
    outputTokens: 239,
    cacheReadTokens: 0,
    cacheCreationTokens: 32_335,
    thinkingTokens: 0,
    ...props,
  });

import { z } from 'zod';
import { preToolUseHookDataContract } from '../pre-tool-use-hook-data/pre-tool-use-hook-data-contract';
import { postToolUseHookDataContract } from '../post-tool-use-hook-data/post-tool-use-hook-data-contract';
import { userPromptSubmitHookDataContract } from '../user-prompt-submit-hook-data/user-prompt-submit-hook-data-contract';
import { baseHookDataContract } from '../base-hook-data/base-hook-data-contract';

export const hookDataContract = z.union([
  preToolUseHookDataContract,
  postToolUseHookDataContract,
  userPromptSubmitHookDataContract,
  baseHookDataContract,
]);

export type HookData = z.infer<typeof hookDataContract>;

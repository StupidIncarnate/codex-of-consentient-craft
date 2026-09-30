/**
 * PURPOSE: Builds a valid TaskPromptsFromContent for tests
 *
 * USAGE:
 * TaskPromptsFromContentStub();
 * // Returns a valid TaskPromptsFromContent
 */

import { taskPromptsFromContentContract } from './task-prompts-from-content-contract';
import type { TaskPromptsFromContent } from './task-prompts-from-content-contract';

export const TaskPromptsFromContentStub = (): TaskPromptsFromContent =>
  taskPromptsFromContentContract.parse([]);

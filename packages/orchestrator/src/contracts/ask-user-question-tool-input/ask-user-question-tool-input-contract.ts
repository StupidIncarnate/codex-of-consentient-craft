/**
 * PURPOSE: Validates the raw `input` object passed to the `mcp__dungeonmaster__ask-user-question`
 * tool — Claude CLI emits `questions` as either a JSON-encoded string or an array of question objects.
 * The orchestrator's normalizer then unifies the shape.
 *
 * USAGE:
 * const parsed = askUserQuestionToolInputContract.parse(rawInput);
 * if (typeof parsed.questions === 'string') { ... }
 *
 * `.passthrough()` so other tool-specific keys (rare; primarily `questions`) survive validation.
 */
import { z } from 'zod';

export const askUserQuestionToolInputContract = z
  .object({
    questions: z
      .union([z.string().brand<'AskUserQuestionRawJsonQuestions'>(), z.array(z.unknown())])
      .optional(),
  })
  .passthrough();

export type AskUserQuestionToolInput = z.infer<typeof askUserQuestionToolInputContract>;

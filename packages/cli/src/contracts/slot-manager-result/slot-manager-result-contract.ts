/**
 * PURPOSE: Defines the result type for slot manager orchestration
 *
 * USAGE:
 * slotManagerResultContract.parse({completed: true});
 * slotManagerResultContract.parse({completed: false, userInputNeeded: {stepId, question, context}});
 * // Returns validated SlotManagerResult
 */

import { z } from 'zod';

import { stepIdContract } from '@dungeonmaster/shared/contracts';

import { streamSignalContract } from '../stream-signal/stream-signal-contract';

const signalQuestionSchema = streamSignalContract.shape.question.unwrap();
const signalContextSchema = streamSignalContract.shape.context.unwrap();

export const slotManagerResultContract = z.discriminatedUnion('completed', [
  z.object({
    completed: z.literal(true),
  }),
  z.object({
    completed: z.literal(false),
    userInputNeeded: z.object({
      stepId: stepIdContract,
      question: signalQuestionSchema,
      context: signalContextSchema,
    }),
  }),
]);

export type SlotManagerResult = z.infer<typeof slotManagerResultContract>;

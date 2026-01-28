/**
 * PURPOSE: Defines the branded type for a signal question from needs-user-input signals
 *
 * USAGE:
 * const question: SignalQuestion = signalQuestionContract.parse('What authentication method?');
 * // Returns validated SignalQuestion branded string
 */

import { z } from 'zod';

export const signalQuestionContract = z.string().min(1).brand<'SignalQuestion'>();

export type SignalQuestion = z.infer<typeof signalQuestionContract>;

/**
 * PURPOSE: The narrowing clause inside a `results` query — `where: { path, method, nth, level,
 * steps }` — every member nullable because a caller names only the ones it cares about, and
 * `.strict()` because a misspelled key (`serverError` instead of `level`) must fail the parse
 * rather than silently filter on nothing. Reach for this over five loose top-level query fields:
 * grouping them here is what lets `resultsQueryContract` reject an unknown filter as `where`'s
 * problem rather than the query's own.
 *
 * USAGE:
 * resultWhereContract.parse({ path: '/api/quests', method: 'POST', nth: null, level: null, steps: null });
 * // Returns a validated ResultWhere
 */

import { z } from 'zod';

import { arrayIndexContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { httpMethodContract } from '../http-method/http-method-contract';
import { logLevelContract } from '../log-level/log-level-contract';
import { stepRangeContract } from '../step-range/step-range-contract';

export const resultWhereContract = z
  .object({
    path: contentTextContract.nullable(),
    method: httpMethodContract.nullable(),
    nth: arrayIndexContract.nullable(),
    level: logLevelContract.nullable(),
    steps: stepRangeContract.nullable(),
  })
  .strict();

export type ResultWhere = z.infer<typeof resultWhereContract>;

/**
 * PURPOSE: What `dungeonmaster siegelense docs` hands back — the `about` preamble, and one document
 * per scope served, each a headed list of lines. `requested` is null for the whole-surface form, so
 * a caller can tell "all seven because none was asked for" from "all seven because seven were
 * asked for" without counting the array. Reach for this over `ContentText` alone when the manual
 * must stay ADDRESSABLE: the sections are the unit a session quotes back, and flattening the
 * document to one string is what makes a reader paste the whole page to cite one rule.
 *
 * USAGE:
 * docsAnswerContract.parse({ requested: null, about: [], scopes: [] });
 * // Returns a validated DocsAnswer
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { docsScopeContract } from '../docs-scope/docs-scope-contract';

const docsSectionContract = z
  .object({
    heading: contentTextContract,
    lines: z.array(contentTextContract),
  })
  .strict();

const docsScopeDocumentContract = z
  .object({
    scope: docsScopeContract,
    audience: contentTextContract,
    summary: contentTextContract,
    sections: z.array(docsSectionContract),
  })
  .strict();

export const docsAnswerContract = z
  .object({
    requested: docsScopeContract.nullable(),
    about: z.array(contentTextContract),
    scopes: z.array(docsScopeDocumentContract),
  })
  .strict();

export type DocsAnswer = z.infer<typeof docsAnswerContract>;
